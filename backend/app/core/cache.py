"""
Redis cache implementation for SafeTasks V2
Provides simple caching with TTL for performance optimization
"""

import json
import logging
from typing import Any, Optional, Union
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class Cache:
    """Redis cache wrapper with error handling and graceful degradation"""

    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.enabled = False

        # Only initialize if Redis URL is configured
        if hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
            try:
                self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.enabled = True
                logger.info("Redis cache initialized successfully")
            except Exception as e:
                logger.warning(f"Redis cache initialization failed: {e}. Continuing without cache.")
                self.enabled = False

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled or not self.client:
            return None

        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Cache get error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """Set value in cache with TTL"""
        if not self.enabled or not self.client:
            return False

        try:
            serialized = json.dumps(value)
            await self.client.setex(key, ttl_seconds, serialized)
            return True
        except Exception as e:
            logger.warning(f"Cache set error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self.enabled or not self.client:
            return False

        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Cache delete error for key {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> bool:
        """Delete all keys matching pattern"""
        if not self.enabled or not self.client:
            return False

        try:
            # Get all keys matching pattern
            keys = await self.client.keys(pattern)
            if keys:
                await self.client.delete(*keys)
            return True
        except Exception as e:
            logger.warning(f"Cache delete pattern error for {pattern}: {e}")
            return False

    async def close(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()


# Global cache instance
cache = Cache()


# Cache key generators for consistency
class CacheKeys:
    """Standardized cache key generation"""

    @staticmethod
    def productions_list(org_id: int, user_role: str, skip: int = 0, limit: int = 50) -> str:
        """Cache key for productions list"""
        return f"productions:list:{org_id}:{user_role}:{skip}:{limit}"

    @staticmethod
    def dashboard_summary(org_id: int) -> str:
        """Cache key for dashboard summary"""
        return f"dashboard:summary:{org_id}"

    @staticmethod
    def services_list(org_id: int) -> str:
        """Cache key for services list"""
        return f"services:list:{org_id}"

    @staticmethod
    def users_list(org_id: int) -> str:
        """Cache key for users list"""
        return f"users:list:{org_id}"


# Dependency injection for FastAPI
async def get_cache() -> Cache:
    """FastAPI dependency for cache"""
    return cache
