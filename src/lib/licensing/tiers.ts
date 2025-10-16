export enum LicenseTier {
  DEMO = 'DEMO',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export interface LicenseLimits {
  restaurants: number
  menus: number
  dishes: number
  qrCodes: number
  ordersPerMonth: number
  aiRequestsPerMonth: number
  analyticsRetentionDays: number
  customDomain: boolean
  whiteLabel: boolean
  apiAccess: boolean
  prioritySupport: boolean
}

export const LICENSE_LIMITS: Record<LicenseTier, LicenseLimits> = {
  [LicenseTier.DEMO]: {
    restaurants: 1,
    menus: 1,
    dishes: 10,
    qrCodes: 1,
    ordersPerMonth: 50,
    aiRequestsPerMonth: 100,
    analyticsRetentionDays: 7,
    customDomain: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: false
  },
  [LicenseTier.BASIC]: {
    restaurants: 1,
    menus: 3,
    dishes: 50,
    qrCodes: 5,
    ordersPerMonth: 500,
    aiRequestsPerMonth: 1000,
    analyticsRetentionDays: 30,
    customDomain: false,
    whiteLabel: false,
    apiAccess: false,
    prioritySupport: false
  },
  [LicenseTier.PREMIUM]: {
    restaurants: 3,
    menus: 10,
    dishes: 200,
    qrCodes: 20,
    ordersPerMonth: 2000,
    aiRequestsPerMonth: 5000,
    analyticsRetentionDays: 90,
    customDomain: true,
    whiteLabel: false,
    apiAccess: true,
    prioritySupport: true
  },
  [LicenseTier.ENTERPRISE]: {
    restaurants: -1, // unlimited
    menus: -1, // unlimited
    dishes: -1, // unlimited
    qrCodes: -1, // unlimited
    ordersPerMonth: -1, // unlimited
    aiRequestsPerMonth: -1, // unlimited
    analyticsRetentionDays: 365,
    customDomain: true,
    whiteLabel: true,
    apiAccess: true,
    prioritySupport: true
  }
}

export function getLicenseLimits(tier: LicenseTier): LicenseLimits {
  return LICENSE_LIMITS[tier]
}

export function isWithinLimits(
  current: number,
  limit: number,
  tier: LicenseTier
): boolean {
  if (tier === LicenseTier.ENTERPRISE) return true
  return current < limit
}
