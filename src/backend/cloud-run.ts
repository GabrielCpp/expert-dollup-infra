import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import {
  appUserAuthDbConnectionString,
  appUserExpertDollupDbConnectionString,
  jwtPublicKey,
} from "./secrets";
import { CloudRunApp } from "../shared";
import { project, location, config, audiences, issuer } from "../configs";
import { enableCloudRun, enableIam } from "../services";


export const expertDollupBucket = new gcp.storage.Bucket(
  "expert-dollup-bucket",
  {
    forceDestroy: true,
    storageClass: "REGIONAL",
    location,
    uniformBucketLevelAccess: true,
  }
);


export const cloudRunApp = new CloudRunApp(
  "export-dollup-app",
  {
    location,
    project,
    account: {
      accountId: "expertdollupcloudrunv2",
      displayName: "Cloud run service account",
    },
    run: {
      public: true,
      serviceImage: config.require("serviceImage"),
      secrets: [
        {
          secret: appUserExpertDollupDbConnectionString,
          name: "EXPERT_DOLLUP_DB_URL",
          key: "latest",
        },
        {
          secret: appUserAuthDbConnectionString,
          name: "AUTH_DB_URL",
          key: "latest",
        },
        {
          secret: jwtPublicKey,
          name: "JWT_PUBLIC_KEY",
          key: "latest",
        },
      ],
      envs: [
        {
          name: "FASTAPI_ENV",
          value: "production",
        },
        {
          name: "JWT_AUDIENCES",
          value: JSON.stringify(audiences),
        },
        {
          name: "JWT_ISSUER",
          value: issuer
        },
        {
          name: "APP_BUCKET_NAME",
          value: expertDollupBucket.name
        }
      ]
    },
  },
  {
    dependsOn: [enableCloudRun, enableIam, expertDollupBucket],
  }
);

export const expertDollupBucketReadWrite = new gcp.storage.BucketIAMMember(
  "expert-dollup-bucket-read-write",
  {
    bucket: expertDollupBucket.name,
    member: pulumi.interpolate`serviceAccount:${cloudRunApp.serviceAccount.email}`,
    role: "roles/storage.objectAdmin",
  },
  {
    dependsOn: [expertDollupBucket, cloudRunApp],
  }
);
