import stripe
from fastapi import APIRouter, Header, HTTPException, Request, status, Depends
from app.core.config import settings
import logging
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.billing_service import BillingService

# Configure Stripe API key globally for webhooks
stripe.api_key = settings.stripe_secret_key

router = APIRouter()
logger = logging.getLogger("app.api.v1.endpoints.webhooks")

@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: AsyncSession = Depends(get_db)):
    logger.info("🔄 Webhook endpoint called")
    logger.info(f"Headers present: stripe-signature={stripe_signature is not None}")

    if not settings.stripe_webhook_secret:
        logger.error("❌ Stripe webhook secret is not configured")
        raise HTTPException(status_code=500, detail="Stripe webhook secret is not configured.")

    try:
        logger.info("🔐 Constructing Stripe event...")
        event = stripe.Webhook.construct_event(
            payload=await request.body(),
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret
        )
        logger.info(f"✅ Stripe event constructed successfully: {event.type}")
    except ValueError as e:
        logger.error(f"❌ Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"❌ Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    logger.info(f"📨 Processing Stripe event: {event.type}")

    try:
        await BillingService.handle_stripe_webhook_event(event, db)
        logger.info(f"✅ Webhook processing completed for event: {event.type}")
    except Exception as e:
        logger.error(f"❌ Error processing webhook event: {e}")
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

    return {"status": "success"}
