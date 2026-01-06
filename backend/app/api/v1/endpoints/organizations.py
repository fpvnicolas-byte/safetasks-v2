from typing import List, Dict, Any
import stripe
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException  # type: ignore
from sqlalchemy import select  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.api.deps import get_current_active_admin, get_current_user
from app.db.session import get_db
from app.models.user import Organization, User
from app.core.config import settings
from app.core.billing_config import SubscriptionPlan, PLAN_LIMITS

router = APIRouter()


class CreateCheckoutSessionRequest(BaseModel):
    plan: SubscriptionPlan
    success_url: str
    cancel_url: str

# Configure Stripe
stripe.api_key = settings.stripe_secret_key


@router.get("/settings")
async def get_organization_settings(
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get organization settings."""

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    organization = result.scalar_one_or_none()

    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "id": organization.id,
        "name": organization.name,
        "cnpj": organization.cnpj,
        "phone": organization.phone,
        "email": organization.email,
        "address": organization.address,
        "default_tax_rate": organization.default_tax_rate,
        "subscription_plan": organization.subscription_plan,
        "subscription_status": organization.subscription_status,
        "trial_ends_at": organization.trial_ends_at,
        "subscription_ends_at": organization.subscription_ends_at,
        "billing_id": organization.billing_id,
    }


@router.patch("/settings")
async def update_organization_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update organization settings."""

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    organization = result.scalar_one_or_none()

    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Update allowed fields
    allowed_fields = ["name", "cnpj", "phone", "email", "address", "default_tax_rate"]

    for field in allowed_fields:
        if field in settings_data:
            value = settings_data[field]
            if field == "default_tax_rate" and value is not None:
                # Ensure tax rate is a valid float
                try:
                    value = float(value)
                    if value < 0 or value > 100:
                        raise ValueError("Tax rate must be between 0 and 100")
                except (ValueError, TypeError):
                    raise HTTPException(status_code=400, detail="Invalid tax rate value")
            setattr(organization, field, value)

    db.add(organization)
    await db.commit()
    await db.refresh(organization)

    return {
        "id": organization.id,
        "name": organization.name,
        "cnpj": organization.cnpj,
        "phone": organization.phone,
        "email": organization.email,
        "address": organization.address,
        "default_tax_rate": organization.default_tax_rate,
    }


@router.post("/create-checkout-session")
async def create_checkout_session(
    request_data: CreateCheckoutSessionRequest,
    current_user: User = Depends(get_current_active_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe Checkout Session for a new subscription or upgrade."""

    organization_result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    organization = organization_result.scalar_one_or_none()

    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Get plan details (e.g., price_id from Stripe, which would be linked to our SubscriptionPlan enum)
    # For this example, we'll use a placeholder price ID.
    # In a real application, you would map `request_data.plan` to a Stripe Price ID.
    # You might store Stripe Price IDs in your `PLAN_LIMITS` or a dedicated DB table.
    if request_data.plan == SubscriptionPlan.STARTER:
        stripe_price_id = "price_1SmKRMQBou9YDSD2HPqUgldI"  # Real Stripe Price ID for Starter
    elif request_data.plan == SubscriptionPlan.PRO:
        stripe_price_id = "price_1SmKRzQBou9YDSD2ORsiMUgI"  # Real Stripe Price ID for Pro
    else:
        raise HTTPException(status_code=400, detail="Invalid subscription plan selected.")

    try:
        checkout_session = stripe.checkout.Session.create(
            customer_email=organization.email, # Or customer ID if already exists
            line_items=[
                {
                    "price": stripe_price_id,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=request_data.success_url,
            cancel_url=request_data.cancel_url,
            client_reference_id=str(organization.id),  # Pass organization ID to Stripe
            metadata={
                "organization_id": str(organization.id),
                "subscription_plan": request_data.plan.value,
            },
        )
        return {"checkout_url": checkout_session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


@router.get("/payment-history", response_model=List[Dict[str, Any]])
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get payment history for the current user's organization."""
    try:
        # Get organization
        result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
        organization = result.scalar_one_or_none()

        if not organization or not organization.billing_id:
            return []

        # Get invoices from Stripe
        stripe.api_key = settings.stripe_secret_key
        invoices = stripe.Invoice.list(
            customer=organization.billing_id,
            limit=10
        )

        # Format payment history
        payment_history = []
        for invoice in invoices.data:
            payment_history.append({
                "id": invoice.id,
                "date": invoice.created,
                "amount": invoice.amount_paid / 100,  # Convert from cents
                "status": "Pago" if invoice.status == "paid" else invoice.status,
                "description": f"Plano {organization.subscription_plan.title()} - {invoice.number or 'Fatura'}"
            })

        return payment_history

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment history: {e}")


@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """Cancel the current user's subscription."""
    try:
        # Get organization
        result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
        organization = result.scalar_one_or_none()

        if not organization or not organization.billing_id:
            raise HTTPException(status_code=404, detail="No active subscription found")

        # Cancel subscription in Stripe
        stripe.api_key = settings.stripe_secret_key

        # Find the subscription
        subscriptions = stripe.Subscription.list(customer=organization.billing_id)
        if not subscriptions.data:
            raise HTTPException(status_code=404, detail="No active subscription found")

        subscription = subscriptions.data[0]  # Get the first (most recent) subscription

        # Cancel the subscription (effective at period end)
        stripe.Subscription.modify(
            subscription.id,
            cancel_at_period_end=True
        )

        # Update local database
        organization.subscription_status = "canceled"
        db.add(organization)
        await db.commit()

        return {"message": "Subscription cancelled successfully"}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling subscription: {e}")


@router.post("/create-portal-session")
async def create_portal_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """Create a Stripe Customer Portal session for billing management."""
    try:
        # Get organization
        result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
        organization = result.scalar_one_or_none()

        if not organization or not organization.billing_id:
            raise HTTPException(status_code=404, detail="No billing information found")

        # Create portal session
        stripe.api_key = settings.stripe_secret_key
        portal_session = stripe.billing_portal.Session.create(
            customer=organization.billing_id,
            return_url=f"{settings.frontend_url}/dashboard/settings"
        )

        return {"portal_url": portal_session.url}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating portal session: {e}")


# Price IDs for different plans (these would be stored in a database in production)
PLAN_PRICE_IDS = {
    SubscriptionPlan.STARTER: "price_1SmKRMQBou9YDSD2HPqUgldI",
    SubscriptionPlan.PRO: "price_1SmKRzQBou9YDSD2ORsiMUgI",
}
