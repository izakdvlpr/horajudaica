/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "omerdehoje-notify",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const oneSignalAppIdSecret = new sst.Secret("ONESIGNAL_APP_ID");
    const oneSignalAppKeySecret = new sst.Secret("ONESIGNAL_API_KEY");

    new sst.aws.Cron(
      "OmerDeHojeNotify",
      {
        schedule: "cron(0 21 * * ? *)", // cron(0 21 * * ? *) 21:00 UTC = 18:00 BRT
        function: {
          handler: "index.handler",
          timeout: "5 minutes",
          nodejs: { install: ["@onesignal/node-onesignal"] },
          link: [oneSignalAppIdSecret, oneSignalAppKeySecret]
        },
      }
    );
  },
});
