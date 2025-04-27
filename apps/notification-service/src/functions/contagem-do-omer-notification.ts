import type { Handler } from 'aws-lambda';
import { OneSignal } from '@horajudaica/subscriptions';
import { getOmerToday } from '@horajudaica/dates';

import { isDevMode } from '../utils/isDevMode';

export const handler: Handler = async () => {
  const omerToday = await getOmerToday();
  
  try {
    const notification = await OneSignal.createEmailNotification({
      templateId: OneSignal.Templates['contagem-do-omer'],
      subject: `Hora Judaica | Contagem do Ômer - Dia ${omerToday?.diaDoOmer}`,
      segmentName: isDevMode ? OneSignal.Segments.TEST_USERS : OneSignal.Segments.CONTAGEM_DO_OMER,
      customData: {
        diaDoOmer: omerToday?.diaDoOmer,
        dataGregoriana: omerToday?.dataGregoriana,
        dataJudaica: omerToday?.dataJudaica,
        semanasDias: omerToday?.semanasDias,
        pronuncia: omerToday?.pronuncia,
        subscriptionType: 'contagem-do-omer'
      }
    });
  
    console.log('Emails enviados.', notification.id);
    
    return {
      body: JSON.stringify({ message: 'Emails enviados!' }),
      statusCode: 200
    };
  } catch (error) {
    console.error('Falha ao enviar emails:', error);
    
    return {
      body: JSON.stringify({ error: 'Falha ao enviar emails' }),
      statusCode: 500
    };
  }
}