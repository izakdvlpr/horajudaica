import axios from 'axios'
import { headers } from 'next/headers';

export async function getIp() {
  const allHeaders = await headers();
  
  const forwardedFor = allHeaders?.get('x-forwarded-for')?.split(', ')?.[0]?.trim()
  const realIp = allHeaders?.get('x-real-ip')?.trim()
  
  return forwardedFor ?? realIp ?? null
}

export interface GeoData {
  countryName: string
  countryCode: string
  regionName: string
  regionCode: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  ip: string
}

export async function getGeoData(ip: string): Promise<GeoData | null> {
  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`)
    
    return {
      countryName: data.country,
      countryCode: data.countryCode,
      regionCode: data.region,
      regionName: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      ip: data.query
    }
  } catch (err) {
    console.error('Error fetching geo data:', err)
    
    return null
  }
}