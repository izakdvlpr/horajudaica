import { isDevMode } from '../utils/isDevMode';
import { secrets } from './secrets';

export const cron = new sst.aws.Cron(
  'ContagemDoOmerNotification',
  {
    schedule: 'rate(1 minute)', // 21:00 UTC = 18:00 BRT
    function: {
      handler: 'src/functions/contagem-do-omer-notification.handler',
      timeout: '5 minutes',
      nodejs: {
        install: [
          '@horajudaica/subscribers',
          '@horajudaica/omerdehoje'
        ]
      },
      environment: {
        ONESIGNAL_APP_ID: secrets.ONESIGNAL_APP_ID.value,
        ONESIGNAL_API_KEY: secrets.ONESIGNAL_API_KEY.value,
      }
    },
  }
);