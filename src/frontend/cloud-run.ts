import { CloudRunApp } from "../shared";
import { project, location, config } from "../configs";
import { enableCloudRun, enableIam, echoServer } from "../services";

export const cloudRunApp = new CloudRunApp(
  "expert-dollup-webapp",
  {
    location,
    project,
    account: {
      accountId: "expertdollupwebappcloudrun",
      displayName: "Cloud run service account",
    },
    run: {
      public: true,
      port: 8080,
      serviceImage:
        config.require("expertDollupWebappImage") || echoServer.imageName,
      secrets: [],
      envs: [],
    },
  },
  {
    dependsOn: [enableCloudRun, enableIam, echoServer],
  }
);
