interface IPInfoResponse {
  ip: string
  city: string
  region: string
  country: string
  loc: string // "lat,lng"
  timezone: string
  org: string
  postal: string
  hostname?: string
  // Additional fields from ipinfo.io
  country_code?: string
  continent?: string
  continent_code?: string
  asn?: string
  as_name?: string
  as_domain?: string
  as_type?: string
  as_last_changed?: string
  is_anonymous?: boolean
  is_anycast?: boolean
  is_hosting?: boolean
  is_mobile?: boolean
  is_satellite?: boolean
  mobile?: {
    name: string
    mcc: string
    mnc: string
  }
  anonymous?: {
    name: string
    is_proxy: boolean
    is_relay: boolean
    is_tor: boolean
    is_vpn: boolean
  }
  bogon?: boolean
}

interface GeolocationData {
  ip: string
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
  timezone: string
  organization: string
  postal: string
  hostname?: string
  // Extended data from ipinfo.io
  countryCode?: string
  continent?: string
  continentCode?: string
  asn?: string
  asName?: string
  asDomain?: string
  asType?: string
  asLastChanged?: string
  isAnonymous?: boolean
  isAnycast?: boolean
  isHosting?: boolean
  isMobile?: boolean
  isSatellite?: boolean
  mobile?: {
    name: string
    mcc: string
    mnc: string
  }
  anonymous?: {
    name: string
    isProxy: boolean
    isRelay: boolean
    isTor: boolean
    isVpn: boolean
  }
  bogon?: boolean
}

export async function getGeolocationData(ipAddress: string): Promise<GeolocationData | null> {
  try {
    // Skip localhost and private IPs
    if (isPrivateIP(ipAddress) || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'unknown') {
      console.log('Skipping geolocation for private/unknown IP:', ipAddress)
      return null
    }

    const token = process.env.IPINFO_TOKEN
    if (!token) {
      console.error('IPINFO_TOKEN not configured')
      return null
    }

    console.log('🌍 Fetching geolocation for IP:', ipAddress)

    const response = await fetch(`https://ipinfo.io/${ipAddress}?token=${token}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'QRMenu-App/1.0'
      }
    })

    if (!response.ok) {
      console.error('IPInfo API error:', response.status, response.statusText)
      return null
    }

    const data: IPInfoResponse = await response.json()
    
    console.log('🌍 Raw ipinfo.io response:', JSON.stringify(data, null, 2))
    
    // Parse coordinates safely
    let latitude = 0
    let longitude = 0
    if (data.loc && typeof data.loc === 'string') {
      const coords = data.loc.split(',')
      if (coords.length === 2) {
        latitude = parseFloat(coords[0]) || 0
        longitude = parseFloat(coords[1]) || 0
      }
    }
    
    console.log('🌍 Parsed coordinates:', { latitude, longitude })

    const result = {
      ip: data.ip,
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country || 'Unknown',
      latitude,
      longitude,
      timezone: data.timezone || 'Unknown',
      organization: data.org || 'Unknown',
      postal: data.postal || '',
      hostname: data.hostname,
      // Extended data
      countryCode: data.country_code,
      continent: data.continent,
      continentCode: data.continent_code,
      asn: data.asn,
      asName: data.as_name,
      asDomain: data.as_domain,
      asType: data.as_type,
      asLastChanged: data.as_last_changed,
      isAnonymous: data.is_anonymous,
      isAnycast: data.is_anycast,
      isHosting: data.is_hosting,
      isMobile: data.is_mobile,
      isSatellite: data.is_satellite,
      mobile: data.mobile ? {
        name: data.mobile.name,
        mcc: data.mobile.mcc,
        mnc: data.mobile.mnc
      } : undefined,
      anonymous: data.anonymous ? {
        name: data.anonymous.name,
        isProxy: data.anonymous.is_proxy,
        isRelay: data.anonymous.is_relay,
        isTor: data.anonymous.is_tor,
        isVpn: data.anonymous.is_vpn
      } : undefined,
      bogon: data.bogon
    }
    
    console.log('🌍 Final geolocation data:', JSON.stringify(result, null, 2))
    return result
  } catch (error) {
    console.error('Error fetching geolocation data:', error)
    return null
  }
}

function isPrivateIP(ip: string): boolean {
  // Check for private IP ranges
  const privateRanges = [
    /^10\./,           // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,     // 192.168.0.0/16
    /^127\./,          // 127.0.0.0/8 (localhost)
    /^::1$/,           // IPv6 localhost
    /^fc00:/,          // IPv6 private
    /^fe80:/           // IPv6 link-local
  ]
  
  return privateRanges.some(range => range.test(ip))
}

export function getClientIP(request: Request): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  const xClientIP = request.headers.get('x-client-ip')
  
  let ip = 'unknown'
  
  if (cfConnectingIP) ip = cfConnectingIP
  else if (realIP) ip = realIP
  else if (xClientIP) ip = xClientIP
  else if (forwarded) ip = forwarded.split(',')[0].trim()
  
  // Clean IPv6-mapped IPv4 addresses (remove ::ffff: prefix)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7) // Remove '::ffff:' prefix
  }
  
  // Remove any remaining IPv6 prefixes
  if (ip.includes('::')) {
    ip = ip.split('::')[0]
  }
  
  console.log('🔍 Cleaned IP address:', ip)
  return ip
}
