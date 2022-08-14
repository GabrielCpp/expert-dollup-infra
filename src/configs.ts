import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export const config = new pulumi.Config();
export const location = gcp.config.region || "us-central1";
export const project = gcp.config.project || "predykt-v2";
export const host = "fabric.gabcpp.biz";
