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
    const ONESIGNAL_APP_ID = new sst.Secret("ONESIGNAL_APP_ID");
    const ONESIGNAL_API_KEY = new sst.Secret("ONESIGNAL_API_KEY");
    const ONESIGNAL_TEMPLATE_ID = new sst.Secret("ONESIGNAL_TEMPLATE_ID");
    
    new sst.aws.Cron(
      "OmerDeHojeNotify",
      {
        schedule: "cron(30 3 * * ? *)", // cron(0 21 * * ? *) 21:00 UTC = 18:00 BRT
        function: {
          handler: "create-email-notification.handler",
          timeout: "5 minutes",
          copyFiles: [{ from: "omer_2025.csv" }],
          nodejs: { install: ["@onesignal/node-onesignal", "csv-parser"] },
          link: [
            ONESIGNAL_APP_ID,
            ONESIGNAL_API_KEY,
            ONESIGNAL_TEMPLATE_ID,
          ]
        },
      }
    );
  },
});
