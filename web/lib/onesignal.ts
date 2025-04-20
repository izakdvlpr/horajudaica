import * as OneSignal from '@onesignal/node-onesignal';

import { env } from './env';

export const oneSignal = new OneSignal.DefaultApi(
  OneSignal.createConfiguration({
    authMethods: {
      rest_api_key: { tokenProvider: { getToken: () => env.ONESIGNAL_API_KEY } }
    }
  })
);