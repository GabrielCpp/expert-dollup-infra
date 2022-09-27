import * as mongodbatlas from "@pulumi/mongodbatlas";
import * as random from "@pulumi/random";
import { config } from "../configs";

export const project = new mongodbatlas.Project("expert-dollup", {
  orgId: config.require("mongoAltasOrgId"),
});

// For serverless https://www.mongodb.com/docs/atlas/reference/api/serverless/create-one-serverless-instance/
export const cluster = new mongodbatlas.Cluster(
  "expert-dollup-cluster",
  {
    backingProviderName: "GCP",
    projectId: project.id,
    providerInstanceSizeName: "M0",
    providerName: "TENANT",
    providerRegionName: "CENTRAL_US", // us-central1
  },
  { dependsOn: [project] }
);

export const appDbPassword = new random.RandomPassword(
  "mongo-app-user-db-password",
  {
    length: 32,
    special: false,
  }
);

export const expertDollupAppUser = new mongodbatlas.DatabaseUser(
  "expert-dollup-app-user",
  {
    authDatabaseName: "admin",
    labels: [
      {
        key: "app-user",
        value: "expert-dollup backend user",
      },
    ],
    password: appDbPassword.result,
    projectId: project.id,
    roles: [
      {
        databaseName: "expert_dollup",
        roleName: "readWrite",
      },
    ],
    scopes: [
      {
        name: cluster.name,
        type: "CLUSTER",
      },
    ],
    username: "expert_dollup",
  },
  { dependsOn: [cluster, appDbPassword] }
);

export const migrationDbPassword = new random.RandomPassword(
  "mongo-migration-user-db-password",
  {
    length: 32,
    special: false,
  }
);

export const expertDollupMigrationUser = new mongodbatlas.DatabaseUser(
  "expert-dollup-migration-user",
  {
    authDatabaseName: "admin",
    labels: [
      {
        key: "migration-user",
        value: "expert-dollup migration user",
      },
    ],
    password: migrationDbPassword.result,
    projectId: project.id,
    roles: [
      {
        databaseName: "expert_dollup",
        roleName: "dbAdmin",
      },
      {
        databaseName: "expert_dollup",
        roleName: "readWrite",
      },
    ],
    scopes: [
      {
        name: cluster.name,
        type: "CLUSTER",
      },
    ],
    username: "expert_dollup_migration",
  },
  { dependsOn: [cluster, migrationDbPassword] }
);

export const migrationUserAuthDbPassword = new random.RandomPassword(
  "migration-user-auth-db-password",
  {
    length: 32,
    special: false,
  }
);

export const authDbMigrationUser = new mongodbatlas.DatabaseUser(
  "migration-user-auth-db",
  {
    authDatabaseName: "admin",
    labels: [
      {
        key: "migration-user",
        value: "expert-dollup migration user",
      },
    ],
    password: migrationUserAuthDbPassword.result,
    projectId: project.id,
    roles: [
      {
        databaseName: "expert_dollup",
        roleName: "dbAdmin",
      },
      {
        databaseName: "expert_dollup",
        roleName: "readWrite",
      },
    ],
    scopes: [
      {
        name: cluster.name,
        type: "CLUSTER",
      },
    ],
    username: "auth_migration",
  },
  { dependsOn: [cluster, migrationUserAuthDbPassword] }
);

export const appUserAuthDbPassword = new random.RandomPassword(
  "app-user-auth-db-password",
  {
    length: 32,
    special: false,
  }
);

export const appUserAuthDb = new mongodbatlas.DatabaseUser(
  "app-user-auth-db",
  {
    authDatabaseName: "admin",
    labels: [
      {
        key: "app-user",
        value: "expert-dollup migration user",
      },
    ],
    password: appUserAuthDbPassword.result,
    projectId: project.id,
    roles: [
      {
        databaseName: "auth",
        roleName: "readWrite",
      },
    ],
    scopes: [
      {
        name: cluster.name,
        type: "CLUSTER",
      },
    ],
    username: "auth",
  },
  { dependsOn: [cluster, appUserAuthDbPassword] }
);
