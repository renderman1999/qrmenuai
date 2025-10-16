import { Redis } from '@upstash/redis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// Upstash Redis configuration
const redisConfig = {
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://bright-dove-17109.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'AULVAAIncDJmNzQ1ZTA4NTFlMjQ0MWM5OTNkZmRlNmI0YTdiZmYyY3AyMTcxMDk',
}

export const redis = globalForRedis.redis ?? new Redis(redisConfig)

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Test connection
redis.ping().then(() => {
  console.log('✅ Upstash Redis connected successfully')
}).catch((error) => {
  console.error('❌ Upstash Redis connection error:', error)
})

export default redis
