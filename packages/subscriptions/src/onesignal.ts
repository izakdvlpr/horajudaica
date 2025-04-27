import { DefaultApi, createConfiguration, Notification, User } from '@onesignal/node-onesignal';

export namespace OneSignal {
  export type OneSinalUser = User
  
  const config = createConfiguration({
    authMethods: {
      rest_api_key: {
        tokenProvider: {
          getToken: () => process.env.ONESIGNAL_API_KEY!
        }
      }
    }
  })
  
  const oneSignalApi = new DefaultApi(config);
  
  export const Segments = {
    TEST_USERS: 'Test Users',
    CONTAGEM_DO_OMER: 'Contagem do Omer',
    PARASHA_SEMANAL: 'Parasha Semanal',
    HORARIOS_DO_SHABAT: 'Horarios do Shabat',
  } as const
  
  export const Templates = {
    'contagem-do-omer': 'e227b265-2bd7-432a-9b54-44229f837f56'
  } as const
  
  export async function createEmailNotification({
    templateId,
    segmentName,
    subscriptionId,
    subject,
    customData
  }: { templateId?: string; segmentName?: string; subscriptionId?: string; subject: string; customData: Record<string, any> }) {
    const notificationData = new Notification()
  
    notificationData.app_id = process.env.ONESIGNAL_APP_ID!;
    notificationData.template_id = templateId
    notificationData.target_channel = "email"
    notificationData.email_subject = subject
    notificationData.custom_data = customData
        
    if (subscriptionId) notificationData.include_subscription_ids = [subscriptionId]
    if (segmentName) notificationData.included_segments = [segmentName];
  
    const notification = await oneSignalApi.createNotification(notificationData)
    
    return notification
  }
  
  export async function createUser({ email, tags, ip, lat, long, timeZone }: { email: string; tags: Record<string, any>, ip?: string; lat?: number; long?: number; timeZone?: string }) {
    const user =  await oneSignalApi.createUser(
      process.env.ONESIGNAL_APP_ID!,
      {
        identity: { email },
        properties: {
          tags,
          ip,
          lat,
          long,
          timezone_id: timeZone
        },
        subscriptions: [{ type: 'Email', token: email }]
      }
    )
    
    return user
  }
  
  export async function findUserById(id: string) {
    const user = await oneSignalApi
      .getUser(process.env.ONESIGNAL_APP_ID!, 'onesignal_id', id)
      .catch(() => null)
    
    return user ?? null
  }
  
  export async function findUserByEmail(email: string) {
    const user = await oneSignalApi
      .getUser(process.env.ONESIGNAL_APP_ID!, 'email', email)
      .catch(() => null)
    
    return user ?? null
  }
  
  export async function updateUserById(
    id: string,
    { tags }: { tags: Record<string, any> }
  ) {
    const user = await oneSignalApi.updateUser(
      process.env.ONESIGNAL_APP_ID!,
      'onesignal_id',
      id,
      { properties: { tags } }
    )
    
    return user
  }
  
  export async function deleteSubscriptionById(id: string) {
    await oneSignalApi.deleteSubscription(process.env.ONESIGNAL_APP_ID!, id)
  }
}