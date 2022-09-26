import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { enableIam } from "../services";
import {
  cloudBuildLogsBucket
} from "../build";
import { auth0Frontend, redirectUri } from "../auth0";
import { auth0Domain, location, audiences, project } from "../configs";
import { CloudBuildCi } from "../shared";
import { cloudRunApp } from '../backend/cloud-run'
import { cloudRunApp as webapp } from './cloud-run'

export const expertDollupWebappImageRepository = new gcp.artifactregistry.Repository(
  "expert-dollup-webapp-repository",
  {
    description: "Expert Dollup webapp image repository",
    format: "DOCKER",
    location,
    repositoryId: "expert-dollup-webapp",
  }
);

export const expertDollupWebappCi = new CloudBuildCi(`expert-dollup-webapp-ci`, {
  project,
  location,
  logBucket: cloudBuildLogsBucket,
  account: {
    accountId: "expertdollupwebappcloudbuild",
    displayName: 'Expert dollup webapp service account',
    addMembers: (name, member, opts) => [
      new gcp.cloudrun.IamMember(`${name}-deploy-cloud-run`, {
        location,
        member,
        service: webapp.service.name,
        role: "roles/run.admin",
      }, opts),
    ]
  },
  repositories: [
    expertDollupWebappImageRepository
  ],
  substitutions: {
    _LOGS_BUCKET_NAME: cloudBuildLogsBucket.name,
    _REPOSITORY_NAME: expertDollupWebappImageRepository.name,
    _BACKEND_URL: cloudRunApp.service.statuses.apply(s => s[0].url),
    _REACT_APP_AUTH0_DOMAIN: auth0Domain,
    _REACT_APP_AUTH0_CLIENT_ID: auth0Frontend.clientId,
    _REACT_APP_AUTH0_AUDIENCE: audiences[0],
    _REACT_APP_AUTH0_REDIRECT_URI: redirectUri,
    _SERVICE_NAME: webapp.service.name,
    _REGION: location,
  },
  ci: {
    name: "expert-dollop-webapp",
    owner: "GabrielCpp",
    push: {
      branch: "^main$",
    },
  }
}, { dependsOn: [ enableIam, cloudRunApp ]})


