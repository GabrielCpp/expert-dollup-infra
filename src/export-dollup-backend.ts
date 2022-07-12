
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { expertDollupAppUser, appUserAuthDb,cluster } from './mongo-atlas'
import * as mongodbatlas from "@pulumi/mongodbatlas";
import { frontend } from './auth0'

const location = gcp.config.region || "us-central1";

function makeDbConnectionString(connectionStrings:  pulumi.UnwrappedArray<mongodbatlas.types.output.ClusterConnectionString>, username: string, password: string): string {
  const url = new URL(connectionStrings[0].standardSrv)
  url.username = username
  url.password = password
  return url.toString()
}

export const appUserExpertDollupDbConnectionString = new gcp.secretmanager.Secret(
  "app-user-expert-dollup-db-connection-string",
  {
    labels: {
      label: "connection-string-app-mongo-db",
    },
    replication: {
      automatic: true,
    },
    secretId: "app-user-expert-dollup-db",
  }
);

export const appUserExpertDollupDbConnectionStringLatest = new gcp.secretmanager.SecretVersion(
  "app-user-expert-dollup-db-connection-string-latest",
  {
    secret: appUserExpertDollupDbConnectionString.id,
    secretData: pulumi.all([cluster.connectionStrings, expertDollupAppUser.username, expertDollupAppUser.password]).apply(([connectionStrings, username, password]) => makeDbConnectionString(connectionStrings, username, password || ''))
  },
  { dependsOn: [ expertDollupAppUser, cluster ] }
);

export const appUserAuthDbConnectionString = new gcp.secretmanager.Secret(
  "app-user-auth-db-connection-string",
  {
    labels: {
      label: "connection-string-app-mongo-db",
    },
    replication: {
      automatic: true,
    },
    secretId: "app-user-auth-db",
  }
);

export const appUserAuthDbConnectionStringLatest = new gcp.secretmanager.SecretVersion(
  "app-user-auth-db-connection-string-latest",
  {
    secret: appUserAuthDbConnectionString.id,
    secretData: pulumi.all([cluster.connectionStrings, appUserAuthDb.username, appUserAuthDb.password]).apply(([connectionStrings, username, password]) => makeDbConnectionString(connectionStrings, username, password || ''))
  },
  { dependsOn: [ appUserAuthDb, cluster ] }
);


export const jwtPublicKey = new gcp.secretmanager.Secret(
  "jwt-public-key",
  {
    labels: {
      label: "jwt-public-key",
    },
    replication: {
      automatic: true,
    },
    secretId: "jwt-public-key",
  }
);

export const jwtPublicKeyLatest = new gcp.secretmanager.SecretVersion(
  "jwt-public-key-latest",
  {
    secret: jwtPublicKey.id,
    secretData: frontend.signingKeys.apply(k => k[0].cert)
  },
  { dependsOn: [ jwtPublicKey, frontend ] }
);

/*
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
*/