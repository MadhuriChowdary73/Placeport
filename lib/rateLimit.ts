import { NextRequest } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (keyed by IP + action)
const rateLimitMap = new Map<string, RateLimitRecord>()

// Periodically clean expired records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  limit: number      // Maximum allowed requests in window
  windowMs: number   // Window size in milliseconds
}

export function checkRateLimit(
  req: NextRequest,
  action: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60 * 1000 }
): { allowed: boolean; remaining: number; resetMs: number } {
  // Extract client IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = (forwarded ? forwarded.split(',')[0].trim() : realIp) || '127.0.0.1'

  const key = `${action}:${ip}`
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetMs: options.windowMs,
    }
  }

  // Existing window
  if (record.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, record.resetTime - now),
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: options.limit - record.count,
    resetMs: Math.max(0, record.resetTime - now),
  }
}
