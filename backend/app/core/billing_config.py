from enum import Enum
from typing import Dict, Any

class SubscriptionPlan(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(str, Enum):
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    INCOMPLETE = "incomplete"

# Configuration for Plan Limits
PLAN_LIMITS: Dict[SubscriptionPlan, Dict[str, Any]] = {
    SubscriptionPlan.FREE: {
        "max_collaborators": 2,
        "max_clients": 5,
        "max_active_productions": 1,
        "features": ["basic_calendar"]
    },
    SubscriptionPlan.STARTER: {
        "max_collaborators": 5,
        "max_clients": 999999, # Unlimited
        "max_active_productions": 10,
        "features": ["basic_calendar", "chat_support"]
    },
    SubscriptionPlan.PRO: {
        "max_collaborators": 20,
        "max_clients": 999999, # Unlimited
        "max_active_productions": 999999, # Unlimited
        "features": ["advanced_reports", "email_support", "team_management"]
    },
    SubscriptionPlan.ENTERPRISE: {
        "max_collaborators": 999999,
        "max_clients": 999999,
        "max_active_productions": 999999,
        "features": ["all"]
    }
}
