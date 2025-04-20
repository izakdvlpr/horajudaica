import { Resource } from "sst";
import * as OneSignal from '@onesignal/node-onesignal';

export async function handler() {
  try {
    const oneSignal = new OneSignal.DefaultApi(
      OneSignal.createConfiguration({
        authMethods: {
          rest_api_key: { tokenProvider: { getToken: () => Resource.ONESIGNAL_API_KEY.value } }
        }
      })
    );
    
    const notification = new OneSignal.Notification()
      
    notification.app_id = Resource.ONESIGNAL_APP_ID.value;
    notification.email_subject = "Omer de Hoje";
    notification.template_id = "e227b265-2bd7-432a-9b54-44229f837f56"
    notification.custom_data = { "key": "value" };
    notification.target_channel = "email"
    notification.included_segments = ['Active Subscriptions'];
    
    await oneSignal.createNotification(notification);
    
    console.log("Emails enviados!");
    
    return {
      body: JSON.stringify({ message: "Emails enviados!" }),
      statusCode: 200
    };
  } catch (err) {
    console.log('Falha ao envia emails')
    
    console.error(err)
    
    return {
      body: JSON.stringify({ error: "Falha ao envia emails" }),
      statusCode: 500
    };
  }
}