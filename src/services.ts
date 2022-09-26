import * as gcp from "@pulumi/gcp";
import { project, location } from "./configs";
import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";

export const defaultProject = new gcp.organizations.Project("default-project", {
  name: project,
  projectId: project,
  billingAccount: "013801-FE089B-3DCC4E",
});

export const enableCloudRun = new gcp.projects.Service(
  "enable-cloud-run",
  {
    service: "run.googleapis.com",
  },
  { dependsOn: [defaultProject] }
);

export const enableIam = new gcp.projects.Service(
  "enable-iam",
  {
    service: "iam.googleapis.com",
  },
  { dependsOn: [defaultProject] }
);

export const enableSecretManager = new gcp.projects.Service(
  "enable-secret-manager",
  {
    service: "secretmanager.googleapis.com",
  },
  { dependsOn: [defaultProject] }
);

export const enableArtifactRegistry = new gcp.projects.Service(
  "enable-artifact-registry",
  {
    service: "artifactregistry.googleapis.com",
  },
  { dependsOn: [defaultProject] }
);

export const enableCloudBuild = new gcp.projects.Service(
  "enable-cloud-build",
  {
    service: "cloudbuild.googleapis.com",
  },
  { dependsOn: [defaultProject] }
);

export const commonRepository = new gcp.artifactregistry.Repository(
  "common-repository",
  {
    description: "Shared images",
    format: "DOCKER",
    location,
    repositoryId: "expert-dollup-common",
    project: defaultProject.projectId,
  },
  { dependsOn: [defaultProject, enableArtifactRegistry] }
);

export const echoServer = new docker.Image("echo-server", {
  imageName: pulumi.interpolate`us-central1-docker.pkg.dev/${gcp.config.project}/${commonRepository.repositoryId}/echo-server:latest`,
  build: {
    context: ".",
  },
});
