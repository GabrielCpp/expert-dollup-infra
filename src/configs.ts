import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as auth0 from "@pulumi/auth0";

export const auth0Domain = auth0.config.domain || "dev-id3ta63u.us.auth0.com";
export const config = new pulumi.Config();
export const location = gcp.config.region || "us-central1";
export const project = gcp.config.project || "predyktv2";
export const host = "gabcpp.biz";
export const issuer = "https://dev-id3ta63u.us.auth0.com/";
export const audiences = [
  "https://dev-id3ta63u.us.auth0.com/api/v2/",
  "https://dev-id3ta63u.us.auth0.com/userinfo",
];
