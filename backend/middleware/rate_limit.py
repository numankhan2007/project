import os
from fastapi import Request, HTTPException
import redis.asyncio as aioredis

_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    return _redis_client


async def rate_limit(request: Request, limit: int = 60, window: int = 60):
    """Sliding window rate limiter. Default: 60 requests/minute per IP."""
    client = _get_redis()
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    ip = ip.split(",")[0].strip()
    key = f"rl:{request.url.path}:{ip}"
    try:
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, window)
        if count > limit:
            raise HTTPException(429, f"Rate limit exceeded. Try again in {window}s.")
    except HTTPException:
        raise
    except Exception:
        pass  # Fail open — don't block requests if Redis is unavailable


def rate_limit_strict(limit: int = 10, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window)
    return dependency


def rate_limit_normal(limit: int = 60, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window)
    return dependency


def rate_limit_relaxed(limit: int = 200, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window)
    return dependency
