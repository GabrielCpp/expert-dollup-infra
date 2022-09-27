import { enableIam, defaultProject, enableCloudBuild, commonRepository } from "../services";
import * as gcp from "@pulumi/gcp";
import { cloudBuildLogsBucket } from "../build";
import { auth0Frontend, redirectUri } from "../auth0";
import { auth0Domain, location, audiences, project } from "../configs";
import { CloudBuildCi } from "../shared";


export const expertDollupWebappCi = new CloudBuildCi(
  `expert-dollup-webapp-ci`,
  {
    project,
    location,
    logBucket: cloudBuildLogsBucket,
    account: {
      accountId: "expertdollupwebappcloudbuild",
      displayName: "Expert dollup webapp service account",
      addMembers: (name, member, opts) => [
        new gcp.projects.IAMMember(
          `${name}-service-account-firebase-admin`,
          {
            role: "roles/firebase.admin",
            member: member,
            project,
          },
          opts
        ),
      ],
    },
    repositories: [commonRepository],
    substitutions: {
      _LOGS_BUCKET_NAME: cloudBuildLogsBucket.name,
      _REACT_APP_AUTH0_DOMAIN: auth0Domain,
      _REACT_APP_AUTH0_CLIENT_ID: auth0Frontend.clientId,
      _REACT_APP_AUTH0_AUDIENCE: audiences[0],
      _REACT_APP_AUTH0_REDIRECT_URI: redirectUri,
      _REGION: location,
    },
    ci: {
      name: "expert-dollop-webapp",
      owner: "GabrielCpp",
      push: {
        branch: "^main$",
      },
    },
  },
  { dependsOn: [enableIam, defaultProject, enableCloudBuild] }
);
