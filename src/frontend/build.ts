import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { enableIam } from "../iam";
import {
  cloudBuildLogsBucket,
  cloudBuildLogsBucketStoprageAdmin,
  expertDollupWebappCloudBuildServiceAccount,
} from "../build";
import { buildedWebAppBucket } from "./webapp-bucket";
import { audience, auth0Frontend, redirectUri } from "../auth0";
import { auth0Domain } from "../configs";

const project = gcp.organizations.getProject({});

export const actAs = new gcp.projects.IAMMember("expert-dollup-webapp-user", {
  project: project.then((project) => project.projectId || ""),
  role: "roles/iam.serviceAccountUser",
  member: pulumi.interpolate`serviceAccount:${expertDollupWebappCloudBuildServiceAccount.email}`,
});

export const webappBucketStorageAdmin = new gcp.storage.BucketIAMBinding(
  "expert-dollup-webapp-cloud-build-service-account-webapp-bucket",
  {
    bucket: buildedWebAppBucket.name,
    members: [
      pulumi.interpolate`serviceAccount:${expertDollupWebappCloudBuildServiceAccount.email}`,
    ],
    role: "roles/storage.admin",
  },
  { dependsOn: [buildedWebAppBucket] }
);

export const logsWriter = new gcp.projects.IAMMember(
  "expert-dollup-webapp-logs-writer",
  {
    project: project.then((project) => project.projectId || ""),
    role: "roles/logging.logWriter",
    member: pulumi.interpolate`serviceAccount:${expertDollupWebappCloudBuildServiceAccount.email}`,
  }
);

export const service_account_trigger = new gcp.cloudbuild.Trigger(
  "expert-dollup-webapp-deploy-on-merge",
  {
    project: "predykt-v2",
    name: "expert-dollup-webapp-deploy-on-merge",
    github: {
      name: "expert-dollop-webapp",
      owner: "GabrielCpp",
      push: {
        branch: "^main$",
      },
    },
    filename: "cloudbuild.yaml",
    serviceAccount: expertDollupWebappCloudBuildServiceAccount.id,
    substitutions: {
      _LOGS_BUCKET_NAME: cloudBuildLogsBucket.name,
      _WEBAPP_BUCKET_NAME: buildedWebAppBucket.name,
      _REACT_APP_AUTH0_DOMAIN: auth0Domain,
      _REACT_APP_AUTH0_CLIENT_ID: auth0Frontend.clientId,
      _REACT_APP_AUTH0_AUDIENCE: audience,
      _REACT_APP_AUTH0_REDIRECT_URI: redirectUri,
    },
  },
  {
    dependsOn: [actAs, logsWriter, cloudBuildLogsBucketStoprageAdmin],
  }
);
