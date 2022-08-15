import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { location } from "../configs";
import {
  createSecretAccessor,
  migrationUserAuthDbConnectionString,
  migrationUserExpertDollupDbConnectionString,
} from "./secrets";

import {
  cloudBuildLogsBucket,
  expertDollupCloudBuildServiceAccount,
} from "../build";

export const expertDollupImageRepository = new gcp.artifactregistry.Repository(
  "my-repo",
  {
    description: "Expert Dollup Image Repository",
    format: "DOCKER",
    location,
    repositoryId: "expert-dollup",
  }
);

const project = gcp.organizations.getProject({});

export const actAs = new gcp.projects.IAMMember("actAs", {
  project: project.then((project) => project.projectId || ""),
  role: "roles/iam.serviceAccountUser",
  member: pulumi.interpolate`serviceAccount:${expertDollupCloudBuildServiceAccount.email}`,
});

export const containerRegistryServiceAgent = new gcp.projects.IAMMember(
  "container-registry-service-agent",
  {
    project: project.then((project) => project.projectId || ""),
    role: "roles/containerregistry.ServiceAgent",
    member: pulumi.interpolate`serviceAccount:${expertDollupCloudBuildServiceAccount.email}`,
  }
);

const artifactRegistryServiceAgent =
  new gcp.artifactregistry.RepositoryIamBinding(
    "artifact-registry-service-agent",
    {
      project: project.then((project) => project.projectId || ""),
      location,
      repository: expertDollupImageRepository.name,
      role: "roles/artifactregistry.repoAdmin",
      members: [
        pulumi.interpolate`serviceAccount:${expertDollupCloudBuildServiceAccount.email}`,
      ],
    }
  );

export const storageAdmin = new gcp.storage.BucketIAMBinding(
  "expert-dollup-cloud-build-service-account-log-bucket",
  {
    bucket: cloudBuildLogsBucket.name,
    members: [
      pulumi.interpolate`serviceAccount:${expertDollupCloudBuildServiceAccount.email}`,
    ],
    role: "roles/storage.admin",
  }
);

export const logsWriter = new gcp.projects.IAMMember("logsWriter", {
  project: project.then((project) => project.projectId || ""),
  role: "roles/logging.logWriter",
  member: pulumi.interpolate`serviceAccount:${expertDollupCloudBuildServiceAccount.email}`,
});

export const cloudBuildMigrationUserAuthDbConnectionString =
  createSecretAccessor(
    "cloud-build-migration-user-auth-db-connection-string",
    expertDollupCloudBuildServiceAccount,
    migrationUserAuthDbConnectionString
  );
export const cloudBuildMigrationUserExpertDollupDbConnectionString =
  createSecretAccessor(
    "cloud-build-migration-user-expert-dollup-db-connection-string",
    expertDollupCloudBuildServiceAccount,
    migrationUserExpertDollupDbConnectionString
  );

export const service_account_trigger = new gcp.cloudbuild.Trigger(
  "expert-dollup-deploy-on-merge",
  {
    project: "predykt-v2",
    name: "expert-dollup-deploy-on-merge",
    github: {
      name: "expert-dollop",
      owner: "GabrielCpp",
      push: {
        branch: "^main$",
      },
    },
    filename: "cloudbuild.yaml",
    serviceAccount: expertDollupCloudBuildServiceAccount.id,
    substitutions: {
      _LOGS_BUCKET_NAME: cloudBuildLogsBucket.name,
    },
  },
  {
    dependsOn: [
      actAs,
      logsWriter,
      storageAdmin,
      containerRegistryServiceAgent,
      artifactRegistryServiceAgent,
      cloudBuildMigrationUserAuthDbConnectionString,
      cloudBuildMigrationUserExpertDollupDbConnectionString,
    ],
  }
);
