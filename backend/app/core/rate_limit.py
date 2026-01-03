"""
Rate limiting configuration for the API.

Uses slowapi to implement rate limiting per IP address to prevent abuse.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
# Format: "number of requests / time period"
RATE_LIMITS = {
    "default": "100/minute",  # Default: 100 requests per minute
    "auth": "10/minute",  # Auth endpoints: 10 requests per minute (prevent brute force)
    "write": "30/minute",  # Write operations: 30 requests per minute
    "read": "200/minute",  # Read operations: 200 requests per minute
}


