import * as gcp from "@pulumi/gcp";

export const enableCloudRun = new gcp.projects.Service("EnableCloudRun", {
  service: "run.googleapis.com",
});

export const enableIam = new gcp.projects.Service("EnableIAM", {
  service: "iam.googleapis.com",
});

