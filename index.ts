import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as random from "@pulumi/random";

import "./src/mongo-atlas";

/*
# https://www.pulumi.com/registry/packages/auth0/installation-configuration/
export AUTH0_DOMAIN=XXXXXXXXXXXXXX
export AUTH0_CLIENT_ID=YYYYYYYYYYYYYY
export AUTH0_CLIENT_SECRET=ZZZZZZZZZZZZZZ
//*
// export MONGODB_ATLAS_PUBLIC_KEY=XXXXXXXXXXXXXX # https://www.pulumi.com/registry/packages/mongodbatlas/installation-configuration/
// export MONGODB_ATLAS_PRIVATE_KEY=YYYYYYYYYYYYYY
// export GOOGLE_CREDENTIALS=$(cat credentials.json) # https://www.pulumi.com/registry/packages/gcp/service-account/
*/
let config = new pulumi.Config();
const location = gcp.config.region || "us-central1";

export const expertDollupDb = new gcp.secretmanager.Secret(
  "expert-dollup-db-secret",
  {
    labels: {
      label: "Connection string to mongo db",
    },
    replication: {
      automatic: true,
    },
    secretId: "expert-dollup-db",
  }
);

export const password = new random.RandomPassword("password", {
  length: 16,
  special: true,
  overrideSpecial: `!#$%&*()-_=+[]{}<>:?`,
});

export const expertDollupDbLatest = new gcp.secretmanager.SecretVersion(
  "expert-dollup-db-secret-version",
  {
    secret: expertDollupDb.id,
    secretData: password.result,
  }
);

export const enableCloudRun = new gcp.projects.Service("EnableCloudRun", {
  service: "run.googleapis.com",
});

const expertDollupServiceImage = config.require("serviceImage");
export const expertDollupService = new gcp.cloudrun.Service(
  "expert-dollup-service",
  {
    location,
    template: {
      spec: {
        containers: [
          {
            image: expertDollupServiceImage,
            envs: [
              {
                name: "SECRET_ENV_VAR",
                valueFrom: {
                  secretKeyRef: {
                    name: expertDollupDb.secretId,
                    key: "latest",
                  },
                },
              },
            ],
          },
        ],
      },
    },
    metadata: {
      annotations: {
        "generated-by": "magic-modules",
      },
    },
    traffics: [
      {
        percent: 100,
        latestRevision: true,
      },
    ],
    autogenerateRevisionName: true,
  },
  { dependsOn: enableCloudRun }
);
