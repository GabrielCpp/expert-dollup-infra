import * as mongodbatlas from "@pulumi/mongodbatlas";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const project = new mongodbatlas.Project("expert-dollup", {
  orgId: config.require("mongoAltasOrgId"),
});

export const cluster = new mongodbatlas.Cluster(
  "expert-dollup-cluster",
  {
    backingProviderName: "GCP",
    projectId: project.id,
    providerInstanceSizeName: "M0",
    // Provider Settings "block"
    providerName: "TENANT",
    providerRegionName: "US_EAST_1",
  },
  { dependsOn: [project] }
);
