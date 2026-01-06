from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
import stripe
import logging

from app.models.user import Organization, User
from app.models.client import Client
from app.core.billing_config import SubscriptionPlan, SubscriptionStatus, PLAN_LIMITS

logger = logging.getLogger("app.services.billing_service")

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
        
        # Count current users
        count_result = await db.execute(
            select(func.count(User.id)).where(User.organization_id == org_id)
        )
        current_count = count_result.scalar_one()

        if current_count >= limits["max_collaborators"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Limite de colaboradores atingido para o plano {plan.value}. (Máx: {limits["max_collaborators"]})")

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
                detail=f"Limite de clientes atingido para o plano {plan.value}. (Máx: {limits["max_clients"]})")

    @staticmethod
    async def handle_stripe_webhook_event(event: stripe.Event, db: AsyncSession):
        logger.info(f"🎯 Handling Stripe event: {event.type}")
        logger.info(f"Event ID: {getattr(event, 'id', 'unknown')}")

        event_data = event.data.object
        logger.info(f"Event data type: {type(event_data)}")

        if event.type == "checkout.session.completed":
            session = event_data
            organization_id = int(session.client_reference_id)

            logger.info(f"Processing checkout.session.completed for org {organization_id}")
            logger.info(f"Stripe session ID: {session.id}")
            logger.info(f"Stripe customer ID: {session.customer}")
            logger.info(f"Stripe subscription ID: {getattr(session, 'subscription', 'None')}")

            result = await db.execute(select(Organization).where(Organization.id == organization_id))
            organization = result.scalar_one_or_none()

            if not organization:
                logger.error(f"Organization {organization_id} not found for checkout session {session.id}")
                return

            logger.info(f"Current subscription_ends_at before update: {organization.subscription_ends_at}")
            logger.info(f"Current subscription_status before update: {organization.subscription_status}")

            # Update organization with billing_id and initial subscription status
            organization.billing_id = session.customer
            organization.subscription_plan = session.metadata.get("subscription_plan", SubscriptionPlan.FREE)
            organization.subscription_status = SubscriptionStatus.ACTIVE # Assuming payment was successful
            
            # Fetch subscription details from Stripe to get current_period_end
            try:
                logger.info(f"Retrieving Stripe subscription: {session.subscription}")
                stripe_subscription = stripe.Subscription.retrieve(session.subscription)

                if stripe_subscription and hasattr(stripe_subscription, 'current_period_end') and stripe_subscription.current_period_end:
                    organization.subscription_ends_at = datetime.fromtimestamp(stripe_subscription.current_period_end)
                    logger.info(f"Subscription ends at: {organization.subscription_ends_at}")
                else:
                    logger.warning("No current_period_end found in Stripe subscription, using fallback")
                    # Fallback: definir uma data padrão (30 dias)
                    organization.subscription_ends_at = datetime.utcnow() + timedelta(days=30)

            except Exception as e:
                logger.error(f"Error retrieving Stripe subscription details: {e}")
                # Fallback: definir uma data padrão em caso de erro
                organization.subscription_ends_at = datetime.utcnow() + timedelta(days=30)
            
            # If it was in trial, reset trial_ends_at
            organization.trial_ends_at = None

            db.add(organization)
            await db.commit()
            await db.refresh(organization)
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

        # Add other event types as needed, e.g., invoice.payment_failed, customer.subscription.trial_will_end, etc.
