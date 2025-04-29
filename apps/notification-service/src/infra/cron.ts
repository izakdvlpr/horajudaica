export const cron = new sst.aws.Cron(
  'ContagemDoOmerNotification',
  {
    schedule: $app.stage === 'development' 
      ? 'rate(1 minute)'
      : 'cron(0 20 * * ? *)', // 20:00 UTC = 17:00 BRT
    function: {
      handler: './src/functions/contagem-do-omer-notification.handler',
      timeout: '2 minutes',
      nodejs: {
        install: [
          '@horajudaica/subscriptions',
          '@horajudaica/dates'
        ]
      },
      environment: {
        ONESIGNAL_APP_ID: new sst.Secret('ONESIGNAL_APP_ID').value,
        ONESIGNAL_API_KEY: new sst.Secret('ONESIGNAL_API_KEY').value,
      }
    },
  }
);