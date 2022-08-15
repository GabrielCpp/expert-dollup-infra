import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { location } from "./configs";
import { enableIam } from "./iam";

export const expertDollupCloudBuildServiceAccount =
  new gcp.serviceaccount.Account(
    "expert-dollup-cloud-build-service-account",
    { accountId: "expert-dollup-cloud-build" },
    { dependsOn: [enableIam] }
  );

export const expertDollupWebappCloudBuildServiceAccount =
  new gcp.serviceaccount.Account(
    "expert-dollup-webapp-cloud-build-service-account",
    { accountId: "webapp-cloud-build" },
    { dependsOn: [enableIam] }
  );

export const cloudBuildLogsBucket = new gcp.storage.Bucket(
  "build-logs-bucket",
  {
    forceDestroy: true,
    storageClass: "REGIONAL",
    location,
    uniformBucketLevelAccess: true,
  }
);

export const cloudBuildLogsBucketStoprageAdmin =
  new gcp.storage.BucketIAMBinding(
    "expert-dollup-webapp-cloud-build-service-account-log-bucket",
    {
      bucket: cloudBuildLogsBucket.name,
      members: [
        pulumi.interpolate`serviceAccount:${expertDollupCloudBuildServiceAccount.email}`,
        pulumi.interpolate`serviceAccount:${expertDollupWebappCloudBuildServiceAccount.email}`,
      ],
      role: "roles/storage.admin",
    },
    {
      dependsOn: [
        expertDollupCloudBuildServiceAccount,
        expertDollupWebappCloudBuildServiceAccount,
      ],
    }
  );
