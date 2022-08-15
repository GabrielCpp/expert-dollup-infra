import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as mongodbatlas from "@pulumi/mongodbatlas";
import {
  expertDollupAppUser,
  appUserAuthDb,
  cluster,
  appDbPassword,
  authDbMigrationUser,
  expertDollupMigrationUser,
} from "./mongo-atlas";
import { auth0Frontend } from "../auth0";

export function createSecretAccessor(
  name: string,
  account: gcp.serviceaccount.Account,
  secret: gcp.secretmanager.Secret
) {
  return new gcp.secretmanager.SecretIamBinding(
    `${name}-secret-accessor-iam-binding`,
    {
      role: "roles/secretmanager.secretAccessor",
      project: secret.project,
      secretId: secret.id,
      members: [pulumi.interpolate`serviceAccount:${account.email}`],
    },
    { dependsOn: [account, secret] }
  );
}

function makeDbConnectionString(
  connectionStrings: pulumi.UnwrappedArray<mongodbatlas.types.output.ClusterConnectionString>,
  username: string,
  password: string,
  database?: string
): string {
  const url = new URL(connectionStrings[0].standardSrv);
  url.username = username;
  url.password = password;
  if (database === undefined) {
    url.pathname = "/";
  } else {
    url.pathname = `/${database}`;
  }

  url.searchParams.append("retryWrites", "true");
  url.searchParams.append("w", "majority");
  url.searchParams.append("tls", "true");
  url.searchParams.append("tlsAllowInvalidCertificates", "true");
  return url.toString();
}

export const migrationUserExpertDollupDbConnectionString =
  new gcp.secretmanager.Secret(
    "migration-user-expert-dollup-db-connection-string",
    {
      labels: {
        label: "connection-string-migration-mongo-db",
      },
      replication: {
        automatic: true,
      },
      secretId: "migration-user-expert-dollup-db",
    }
  );

export const migrationUserExpertDollupDbConnectionStringLatest =
  new gcp.secretmanager.SecretVersion(
    "migration-user-expert-dollup-db-connection-string-latest",
    {
      secret: migrationUserExpertDollupDbConnectionString.id,
      secretData: pulumi
        .all([
          cluster.connectionStrings,
          expertDollupMigrationUser.username,
          appDbPassword.result,
          expertDollupMigrationUser.roles,
        ])
        .apply(([connectionStrings, username, password, roles]) =>
          makeDbConnectionString(
            connectionStrings,
            username,
            password || "",
            roles.find((r) => r.databaseName !== undefined)?.databaseName
          )
        ),
    },
    { dependsOn: [expertDollupMigrationUser, cluster, appDbPassword] }
  );

export const migrationUserAuthDbConnectionString = new gcp.secretmanager.Secret(
  "migration-user-auth-db-connection-string",
  {
    labels: {
      label: "auth-db-migration-connection-string",
    },
    replication: {
      automatic: true,
    },
    secretId: "migration-user-auth-db",
  }
);

export const migrationUserAuthDbConnectionStringLatest =
  new gcp.secretmanager.SecretVersion(
    "migration-user-auth-db-connection-string-latest",
    {
      secret: migrationUserAuthDbConnectionString.id,
      secretData: pulumi
        .all([
          cluster.connectionStrings,
          authDbMigrationUser.username,
          authDbMigrationUser.password,
          authDbMigrationUser.roles,
        ])
        .apply(([connectionStrings, username, password, roles]) =>
          makeDbConnectionString(
            connectionStrings,
            username,
            password || "",
            roles.find((r) => r.databaseName !== undefined)?.databaseName
          )
        ),
    },
    { dependsOn: [authDbMigrationUser, cluster] }
  );

export const appUserExpertDollupDbConnectionString =
  new gcp.secretmanager.Secret("app-user-expert-dollup-db-connection-string", {
    labels: {
      label: "connection-string-app-mongo-db",
    },
    replication: {
      automatic: true,
    },
    secretId: "app-user-expert-dollup-db",
  });

export const appUserExpertDollupDbConnectionStringLatest =
  new gcp.secretmanager.SecretVersion(
    "app-user-expert-dollup-db-connection-string-latest",
    {
      secret: appUserExpertDollupDbConnectionString.id,
      secretData: pulumi
        .all([
          cluster.connectionStrings,
          expertDollupAppUser.username,
          appDbPassword.result,
          expertDollupAppUser.roles,
        ])
        .apply(([connectionStrings, username, password, roles]) =>
          makeDbConnectionString(
            connectionStrings,
            username,
            password || "",
            roles.find((r) => r.databaseName !== undefined)?.databaseName
          )
        ),
    },
    { dependsOn: [expertDollupAppUser, cluster, appDbPassword] }
  );

export const appUserAuthDbConnectionString = new gcp.secretmanager.Secret(
  "app-user-auth-db-connection-string",
  {
    labels: {
      label: "auth-db-connection-string",
    },
    replication: {
      automatic: true,
    },
    secretId: "app-user-auth-db",
  }
);

export const appUserAuthDbConnectionStringLatest =
  new gcp.secretmanager.SecretVersion(
    "app-user-auth-db-connection-string-latest",
    {
      secret: appUserAuthDbConnectionString.id,
      secretData: pulumi
        .all([
          cluster.connectionStrings,
          appUserAuthDb.username,
          appUserAuthDb.password,
          appUserAuthDb.roles,
        ])
        .apply(([connectionStrings, username, password, roles]) =>
          makeDbConnectionString(
            connectionStrings,
            username,
            password || "",
            roles.find((r) => r.databaseName !== undefined)?.databaseName
          )
        ),
    },
    { dependsOn: [appUserAuthDb, cluster] }
  );

export const jwtPublicKey = new gcp.secretmanager.Secret("jwt-public-key", {
  labels: {
    label: "jwt-public-key",
  },
  replication: {
    automatic: true,
  },
  secretId: "jwt-public-key",
});

export const jwtPublicKeyLatest = new gcp.secretmanager.SecretVersion(
  "jwt-public-key-latest",
  {
    secret: jwtPublicKey.id,
    secretData: auth0Frontend.signingKeys.apply((k) =>
      Buffer.from(k[0].cert).toString("base64")
    ),
  },
  { dependsOn: [jwtPublicKey, auth0Frontend] }
);
