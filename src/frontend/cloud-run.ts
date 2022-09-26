import { CloudRunApp } from "../shared";
import { project, location, config } from "../configs";
import { enableCloudRun, enableIam } from "../services";
import * as docker from "@pulumi/docker";
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

export const commonRepository = new gcp.artifactregistry.Repository(
  "common-repository",
  {
    description: "Shared images",
    format: "DOCKER",
    location,
    repositoryId: "expert-dollup-common",
  }
);

const image = new docker.Image("echo-server", {
  imageName: pulumi.interpolate`us-central1-docker.pkg.dev/${gcp.config.project}/${commonRepository.repositoryId}/echo-server:latest`,
  build: {
    context: ".",
  },
});

export const cloudRunApp = new CloudRunApp(
  "expert-dollup-webapp",
  {
    location,
    project,
    account: {
      accountId: "expertdollupwebappcloudrun",
      displayName: "Cloud run service account",
    },
    run: {
      public: true,
      port: 5678,
      serviceImage:
        config.require("expertDollupWebappImage") || image.imageName,
      secrets: [],
      envs: [],
    },
  },
  {
    dependsOn: [enableCloudRun, enableIam, image],
  }
);
