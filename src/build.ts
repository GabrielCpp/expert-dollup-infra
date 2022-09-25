import * as gcp from "@pulumi/gcp";
import { location } from "./configs";

export const cloudBuildLogsBucket = new gcp.storage.Bucket(
  "build-logs-bucket",
  {
    forceDestroy: true,
    storageClass: "REGIONAL",
    location,
    uniformBucketLevelAccess: true,
  }
);
