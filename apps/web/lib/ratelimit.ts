import { Ratelimit } from "@upstash/ratelimit";

import { redis } from './redis';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(2, '10m')
});

export async function createRateLimit(geoIp: string) {
  const { success, reset } = await ratelimit.limit(geoIp);
  
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    
    return { success: false, message: `Você já se inscreveu recentemente. Tente novamente em ${retryAfter} segundos.` }
  }
  
  return { success: true }
}