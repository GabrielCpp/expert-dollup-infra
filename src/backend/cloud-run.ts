import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {
  appUserAuthDbConnectionString,
  appUserExpertDollupDbConnectionString,
  createSecretAccessor,
  jwtPublicKey,
} from "./secrets";
import { project, location, config } from "../configs";
import { enableIam } from "../iam";

export const enableCloudRun = new gcp.projects.Service("EnableCloudRun", {
  service: "run.googleapis.com",
});

export const cloudRunServiceAccount = new gcp.serviceaccount.Account(
  "cloud-run-service-account",
  {
    accountId: "expertdollupcloudrun",
    displayName: "Cloud run service account",
    project,
  },
  { dependsOn: [enableCloudRun, enableIam] }
);

export const cloudRunServiceAccountMember = new gcp.serviceaccount.IAMMember(
  "cloud-run-service-account-member",
  {
    serviceAccountId: cloudRunServiceAccount.name,
    role: "roles/iam.serviceAccountUser",
    member: "user:gabcpp17@gmail.com",
  }
);

export const cloudRunServiceAccountCloudRunAgent =
  new gcp.serviceaccount.IAMMember(
    "cloud-run-service-account-cloud-run-agent",
    {
      serviceAccountId: cloudRunServiceAccount.name,
      role: "roles/run.serviceAgent",
      member: pulumi.interpolate`serviceAccount:${cloudRunServiceAccount.email}`,
    }
  );

export const cloudRunServiceAccountAppUserExpertDollupDbConnectionString =
  createSecretAccessor(
    "cloud-run-service-account-app-user-expert-dollup-db-connection-string",
    cloudRunServiceAccount,
    appUserExpertDollupDbConnectionString
  );

export const cloudRunServiceAccountAppUserAuthDbConnectionString =
  createSecretAccessor(
    "cloud-run-service-account-app-user-auth-db-connection-string",
    cloudRunServiceAccount,
    appUserAuthDbConnectionString
  );

export const cloudRunServiceAccountJwtPublicKey = createSecretAccessor(
  "cloud-run-service-account-jwt-public-key",
  cloudRunServiceAccount,
  jwtPublicKey
);

export const expertDollupService = new gcp.cloudrun.Service(
  "expert-dollup-service",
  {
    location,
    template: {
      spec: {
        serviceAccountName: cloudRunServiceAccount.email,
        containers: [
          {
            image: config.require("serviceImage"),
            ports: [
              {
                containerPort: 8000,
              },
            ],
            envs: [
              {
                name: "EXPERT_DOLLUP_DB_URL",
                valueFrom: {
                  secretKeyRef: {
                    name: appUserExpertDollupDbConnectionString.secretId,
                    key: "latest",
                  },
                },
              },
              {
                name: "AUTH_DB_URL",
                valueFrom: {
                  secretKeyRef: {
                    name: appUserAuthDbConnectionString.secretId,
                    key: "latest",
                  },
                },
              },
              {
                name: "JWT_PUBLIC_KEY",
                valueFrom: {
                  secretKeyRef: {
                    name: jwtPublicKey.secretId,
                    key: "latest",
                  },
                },
              },
              {
                name: "FASTAPI_ENV",
                value: "production",
              },
            ],
          },
        ],
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
  {
    dependsOn: [
      enableCloudRun,
      cloudRunServiceAccountMember,
      cloudRunServiceAccountCloudRunAgent,
      cloudRunServiceAccountAppUserExpertDollupDbConnectionString,
      cloudRunServiceAccountAppUserAuthDbConnectionString,
      cloudRunServiceAccountJwtPublicKey,
    ],
  }
);
