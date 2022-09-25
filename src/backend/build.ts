import * as gcp from "@pulumi/gcp";
import { location, project } from "../configs";
import { cloudBuildLogsBucket } from "../build";
import { CloudBuildCi, createSecretAccessor } from "../shared";
import { enableIam } from "../services";
import { cloudRunApp } from "./cloud-run";
import {
  migrationUserAuthDbConnectionString,
  migrationUserExpertDollupDbConnectionString,
} from "./secrets";

export const expertDollupImageRepository = new gcp.artifactregistry.Repository(
  "my-repo",
  {
    description: "Expert Dollup Image Repository",
    format: "DOCKER",
    location,
    repositoryId: "expert-dollup",
  }
);

export const expertDollupCi = new CloudBuildCi(
  "expert-dollup-ci",
  {
    logBucket: cloudBuildLogsBucket,
    project,
    location,
    account: {
      accountId: "expertdollupcloudbuild",
      displayName: "Expert dollup CI",
      addMembers: (name, member, opts) => [
        new gcp.cloudrun.IamMember(`${name}-deploy-cloud-run`, {
          location,
          member,
          service: cloudRunApp.service.name,
          role: "roles/run.admin",
        }),
        createSecretAccessor(
          `${name}-migration-user-auth-db-connection-string`,
          member,
          migrationUserAuthDbConnectionString,
          opts
        ),
        createSecretAccessor(
          `${name}-migration-user-expert-dollup-db-connection-string`,
          member,
          migrationUserExpertDollupDbConnectionString,
          opts
        ),
      ],
    },
    substitutions: {
      _SERVICE_NAME: cloudRunApp.service.name,
      _REGION: location,
    },
    repositories: [expertDollupImageRepository],
    ci: {
      name: "expert-dollop",
      owner: "GabrielCpp",
      push: {
        branch: "^main$",
      },
    }
  },
  { dependsOn: [cloudRunApp, enableIam] }
);
