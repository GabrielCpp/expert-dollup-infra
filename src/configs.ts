import * as gcp from "@pulumi/gcp";

export const location = gcp.config.region || "us-central1";
export const project = gcp.config.project || "predykt-v2";
