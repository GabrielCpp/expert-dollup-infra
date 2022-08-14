import * as gcp from "@pulumi/gcp";
import { location } from "../configs";

export const buildedWebAppBucket = new gcp.storage.Bucket("webapp-content", {
  forceDestroy: true,
  storageClass: "REGIONAL",
  location,
  uniformBucketLevelAccess: true,
});

export const webappBucket = new gcp.compute.BackendBucket(
  "webapp-content-backend-bucket",
  {
    description: "Serve the webapp",
    bucketName: buildedWebAppBucket.name,
    enableCdn: true,
  }
);
