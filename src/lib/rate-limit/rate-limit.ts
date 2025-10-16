import { NextRequest } from 'next/server'
import { redis } from '../redis/redis'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

export const LICENSE_LIMITS = {
  DEMO: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 15 minutes, 100 requests
  BASIC: { windowMs: 15 * 60 * 1000, maxRequests: 1000 }, // 15 minutes, 1000 requests
  PREMIUM: { windowMs: 15 * 60 * 1000, maxRequests: 5000 }, // 15 minutes, 5000 requests
  ENTERPRISE: { windowMs: 15 * 60 * 1000, maxRequests: 50000 }, // 15 minutes, 50000 requests
}

export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = config.keyGenerator ? config.keyGenerator(req) : `rate_limit:${req.ip}`
  
  try {
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000))
    }
    
    const remaining = Math.max(0, config.maxRequests - current)
    const ttl = await redis.ttl(key)
    const resetTime = Date.now() + (ttl * 1000)
    
    return {
      allowed: current <= config.maxRequests,
      remaining,
      resetTime
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Allow request if Redis is down
    return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs }
  }
}
