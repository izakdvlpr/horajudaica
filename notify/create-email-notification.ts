import { Resource } from 'sst';
import * as OneSignal from '@onesignal/node-onesignal';

import { getOmerToday } from './get-omer-today';

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
    notification.template_id = Resource.ONESIGNAL_TEMPLATE_ID.value
    notification.target_channel = "email"
    notification.included_segments = ['Active Subscriptions'];
    
    const omerData = await getOmerToday();
    
    notification.email_subject = `Ômer de Hoje - Dia ${omerData?.diaDoOmer}`;
    
    notification.custom_data = {
      "diaDoOmer": omerData?.diaDoOmer,
      "dataGregoriana": omerData?.dataGregoriana,
      "dataJudaica": omerData?.dataJudaica,
      "semanasDias": omerData?.semanasDias,
      "pronuncia": omerData?.pronuncia,
    };
    
    await oneSignal.createNotification(notification)
    
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