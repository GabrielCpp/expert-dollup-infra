import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { location } from "../configs";
import { enableIam } from "../iam";
import { cloudBuildLogsBucket } from "../build";

export const webappImageRepository = new gcp.artifactregistry.Repository(
  "expert-dollup-webapp",
  {
    description: "Expert Dollup webapp image repository",
    format: "DOCKER",
    location,
    repositoryId: "expert-dollup-webapp",
  }
);

const project = gcp.organizations.getProject({});

export const cloudBuildServiceAccount = new gcp.serviceaccount.Account(
  "expert-dollup-webapp-cloud-build-service-account",
  { accountId: "webapp-cloud-build" },
  { dependsOn: [enableIam] }
);

export const actAs = new gcp.projects.IAMMember("expert-dollup-webapp-user", {
  project: project.then((project) => project.projectId || ""),
  role: "roles/iam.serviceAccountUser",
  member: pulumi.interpolate`serviceAccount:${cloudBuildServiceAccount.email}`,
});

const artifactRegistryServiceAgent =
  new gcp.artifactregistry.RepositoryIamBinding(
    "expert-dollup-webapp-artifact-registry-service-agent",
    {
      project: project.then((project) => project.projectId || ""),
      location,
      repository: webappImageRepository.name,
      role: "roles/artifactregistry.repoAdmin",
      members: [
        pulumi.interpolate`serviceAccount:${cloudBuildServiceAccount.email}`,
      ],
    }
  );

export const storageAdmin = new gcp.storage.BucketIAMBinding(
  "expert-dollup-webapp-cloud-build-service-account-log-bucket",
  {
    bucket: cloudBuildLogsBucket.name,
    members: [
      pulumi.interpolate`serviceAccount:${cloudBuildServiceAccount.email}`,
    ],
    role: "roles/storage.admin",
  }
);

export const logsWriter = new gcp.projects.IAMMember(
  "expert-dollup-webapp-logs-writer",
  {
    project: project.then((project) => project.projectId || ""),
    role: "roles/logging.logWriter",
    member: pulumi.interpolate`serviceAccount:${cloudBuildServiceAccount.email}`,
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
    serviceAccount: cloudBuildServiceAccount.id,
    substitutions: {
      _LOGS_BUCKET_NAME: cloudBuildLogsBucket.name,
    },
  },
  {
    dependsOn: [actAs, logsWriter, storageAdmin, artifactRegistryServiceAgent],
  }
);
