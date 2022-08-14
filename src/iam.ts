import * as gcp from "@pulumi/gcp";

export const enableIam = new gcp.projects.Service("EnableIAM", {
  service: "iam.googleapis.com",
});