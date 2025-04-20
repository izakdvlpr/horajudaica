'use server'

import { env } from '@/lib/env'
import { oneSignal } from '@/lib/onesignal'

interface SubscriberActionRequest {
  name: string
  email: string
}

export async function subscriberAction({ name, email }: SubscriberActionRequest) {
  try {
    await oneSignal.createUser(
      env.ONESIGNAL_APP_ID,
      {
        identity: {
          name,
          email,
        },
        subscriptions: [
          {
            type: 'Email',
            token: email,
          }
        ]
      }
    )
  } catch (err: any) {
    console.error(err)
    
    return { error: 'Erro ao se inscrever' }
  }
}
