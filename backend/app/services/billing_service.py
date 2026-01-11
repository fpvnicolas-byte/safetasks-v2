from datetime import datetime, timedelta
from typing import Optional, Set
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
import stripe
import logging

from app.models.user import Organization, Profile
from app.models.client import Client
from app.core.billing_config import SubscriptionPlan, SubscriptionStatus, PLAN_LIMITS

logger = logging.getLogger("app.services.billing_service")

# In-memory set for idempotency (use Redis in production for distributed systems)
_processed_sessions: Set[str] = set()
MAX_PROCESSED_SESSIONS = 10000  # Prevent memory overflow in long-running processes

class BillingService:
    @staticmethod
    async def get_organization_license_status(org: Organization) -> bool:
        """
        Check if organization has a valid license to operate.
        True if status is active OR if still within trial period.
        """
        if org.subscription_status == SubscriptionStatus.ACTIVE:
            return True
        
        if org.subscription_status == SubscriptionStatus.TRIALING:
            if org.trial_ends_at and org.trial_ends_at > datetime.now():
                return True
        
        return False

    @staticmethod
    async def check_collaborator_limit(org_id: int, db: AsyncSession) -> None:
        """Verify if organization can add more collaborators based on its plan."""
        # Get organization
        result = await db.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalar_one_or_none()
        
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        # Get plan limits
        plan = SubscriptionPlan(org.subscription_plan)
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS[SubscriptionPlan.FREE])
        
        # Count current collaborators (profiles)
        count_result = await db.execute(
            select(func.count(Profile.id)).where(Profile.organization_id == org_id)
        )
        current_count = count_result.scalar_one()

        if current_count >= limits["max_collaborators"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Limite de colaboradores atingido para o plano {plan.value}. (Máx: {limits['max_collaborators']})")

    @staticmethod
    async def check_client_limit(org_id: int, db: AsyncSession) -> None:
        """Verify if organization can add more clients based on its plan."""
        result = await db.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalar_one_or_none()
        
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        plan = SubscriptionPlan(org.subscription_plan)
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS[SubscriptionPlan.FREE])
        
        # Count current clients
        count_result = await db.execute(
            select(func.count(Client.id)).where(Client.organization_id == org_id)
        )
        current_count = count_result.scalar_one()

        if current_count >= limits["max_clients"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Limite de clientes atingido para o plano {plan.value}. (Máx: {limits['max_clients']})")

    @staticmethod
    async def handle_stripe_webhook_event(event: stripe.Event, db: AsyncSession):
        """
        Handle Stripe webhook events with security improvements:
        - Idempotency checking
        - Payment status validation
        - Proper error handling
        """
        logger.info(f"🎯 Handling Stripe event: {event.type}")
        event_id = getattr(event, 'id', 'unknown')
        logger.info(f"Event ID: {event_id}")

        # Check for duplicate event processing (idempotency)
        if event_id in _processed_sessions:
            logger.info(f"Event {event_id} already processed, skipping")
            return

        event_data = event.data.object
        logger.info(f"Event data type: {type(event_data)}")

        if event.type == "checkout.session.completed":
            session = event_data
            session_id = session.id
            
            # Idempotency check for session
            if session_id in _processed_sessions:
                logger.info(f"Session {session_id} already processed, skipping")
                return
            
            # Clean up old processed sessions to prevent memory overflow
            if len(_processed_sessions) > MAX_PROCESSED_SESSIONS:
                _processed_sessions.clear()
            
            organization_id = int(session.client_reference_id) if session.client_reference_id else None

            logger.info(f"Processing checkout.session.completed for org {organization_id}")
            logger.info(f"Stripe session ID: {session_id}")
            logger.info(f"Stripe customer ID: {session.customer}")
            logger.info(f"Stripe subscription ID: {getattr(session, 'subscription', 'None')}")

            # Security: Validate payment_status
            payment_status = getattr(session, 'payment_status', None)
            logger.info(f"Payment status: {payment_status}")
            
            if payment_status != "paid":
                logger.warning(f"Payment not completed for session {session_id}. Status: {payment_status}")
                # Don't activate subscription if payment isn't confirmed
                _processed_sessions.add(event_id)
                return

            if not organization_id:
                logger.error(f"No organization_id found in checkout session {session_id}")
                _processed_sessions.add(event_id)
                return

            result = await db.execute(select(Organization).where(Organization.id == organization_id))
            organization = result.scalar_one_or_none()

            if not organization:
                logger.error(f"Organization {organization_id} not found for checkout session {session_id}")
                _processed_sessions.add(event_id)
                return

            logger.info(f"Current subscription_ends_at before update: {organization.subscription_ends_at}")
            logger.info(f"Current subscription_status before update: {organization.subscription_status}")

            # Update organization with billing_id and initial subscription status
            organization.billing_id = session.customer
            organization.subscription_plan = session.metadata.get("subscription_plan", SubscriptionPlan.FREE)
            organization.subscription_status = SubscriptionStatus.ACTIVE
            
            # Fetch subscription details from Stripe to get current_period_end
            try:
                logger.info(f"Retrieving Stripe subscription: {session.subscription}")
                stripe_subscription = stripe.Subscription.retrieve(session.subscription)

                if stripe_subscription and hasattr(stripe_subscription, 'current_period_end') and stripe_subscription.current_period_end:
                    organization.subscription_ends_at = datetime.fromtimestamp(stripe_subscription.current_period_end)
                    logger.info(f"Subscription ends at: {organization.subscription_ends_at}")
                else:
                    logger.warning("No current_period_end found in Stripe subscription, using fallback")
                    organization.subscription_ends_at = datetime.utcnow() + timedelta(days=30)

            except Exception as e:
                logger.error(f"Error retrieving Stripe subscription details: {e}")
                organization.subscription_ends_at = datetime.utcnow() + timedelta(days=30)
            
            organization.trial_ends_at = None

            db.add(organization)
            await db.commit()
            await db.refresh(organization)
            
            # Mark event and session as processed
            _processed_sessions.add(event_id)
            _processed_sessions.add(session_id)
            logger.info(f"Organization {organization_id} subscription updated to {organization.subscription_plan}")

        elif event.type == "customer.subscription.updated":
            subscription = event_data
            organization_id = int(subscription.metadata.get("organization_id"))

            result = await db.execute(select(Organization).where(Organization.id == organization_id))
            organization = result.scalar_one_or_none()

            if not organization:
                logger.error(f"Organization {organization_id} not found for subscription {subscription.id}")
                return
            
            organization.subscription_plan = subscription.metadata.get("subscription_plan", organization.subscription_plan) # Can be updated from metadata
            organization.subscription_status = subscription.status # Stripe status directly maps
            organization.subscription_ends_at = datetime.fromtimestamp(subscription.current_period_end)

            db.add(organization)
            await db.commit()
            await db.refresh(organization)
            logger.info(f"Organization {organization_id} subscription status updated to {organization.subscription_status}")
        
        elif event.type == "customer.subscription.deleted":
            subscription = event_data
            organization_id = int(subscription.metadata.get("organization_id"))

            result = await db.execute(select(Organization).where(Organization.id == organization_id))
            organization = result.scalar_one_or_none()

            if not organization:
                logger.error(f"Organization {organization_id} not found for deleted subscription {subscription.id}")
                return

            organization.subscription_status = SubscriptionStatus.CANCELED
            db.add(organization)
            await db.commit()
            await db.refresh(organization)
            logger.info(f"Organization {organization_id} subscription status set to CANCELED.")
            
        elif event.type == "invoice.payment_failed":
            invoice = event_data
            customer_id = invoice.get("customer")
            
            logger.warning(f"Payment failed for customer {customer_id}")
            logger.warning(f"Invoice ID: {invoice.id}")
            logger.warning(f"Failure message: {invoice.get("last_finalization_error", {}).get("message", "Unknown error")}")
            
            # Find organization by billing_id and downgrade to FREE
            result = await db.execute(select(Organization).where(Organization.billing_id == customer_id))
            organization = result.scalar_one_or_none()
            
            if organization:
                logger.warning(f"Downgrading organization {organization.id} due to payment failure")
                organization.subscription_status = SubscriptionStatus.PAST_DUE
                db.add(organization)
                await db.commit()
                await db.refresh(organization)
                logger.info(f"Organization {organization.id} subscription status set to PAST_DUE")
            else:
                logger.warning(f"No organization found for billing_id {customer_id}")
