import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

interface CloudBuildCiArgs {
  location: string;
  project: string;
  logBucket: gcp.storage.Bucket;
  account: {
    accountId: string;
    displayName: string;
    addMembers: (
      name: string,
      member: pulumi.Output<string>,
      opts: pulumi.ResourceOptions
    ) => pulumi.CustomResource[];
  };
  substitutions: Record<string, string | pulumi.Output<string>>;
  repositories: gcp.artifactregistry.Repository[];
  ci: pulumi.Input<gcp.types.input.cloudbuild.TriggerGithub>;
}

export class CloudBuildCi extends pulumi.ComponentResource {
  readonly serviceAccount: gcp.serviceaccount.Account;
  readonly trigger: gcp.cloudbuild.Trigger;
  readonly serviceAccountProjectMembers: Array<
    | gcp.projects.IAMMember
    | gcp.storage.BucketIAMMember
    | gcp.artifactregistry.RepositoryIamMember
  >;

  readonly customResource: pulumi.CustomResource[];

  constructor(
    name: string,
    {
      logBucket,
      location,
      project,
      account,
      substitutions,
      repositories,
      ci,
    }: CloudBuildCiArgs,
    opts?: pulumi.ResourceOptions
  ) {
    const inputs: pulumi.Inputs = {
      options: opts,
    };

    super("pulumi-contrib:components:CloudBuildCi", name, inputs, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    this.serviceAccount = new gcp.serviceaccount.Account(
      `${name}-service-account`,
      account,
      defaultResourceOptions
    );

    this.customResource = account.addMembers(
      name,
      pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
      defaultResourceOptions
    );

    this.serviceAccountProjectMembers = [
      new gcp.projects.IAMMember(
        `${name}-act-as`,
        {
          project: project,
          role: "roles/iam.serviceAccountUser",
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
        },
        defaultResourceOptions
      ),
      new gcp.projects.IAMMember(
        `${name}-artifact-registry-service-agent`,
        {
          project,
          role: "roles/containerregistry.ServiceAgent",
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
        },
        defaultResourceOptions
      ),
      new gcp.storage.BucketIAMMember(
        `${name}-service-account-log-bucket`,
        {
          bucket: logBucket.name,
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
          role: "roles/storage.admin",
        },
        defaultResourceOptions
      ),
      new gcp.projects.IAMMember(
        `${name}-service-account-log-writer`,
        {
          project,
          role: "roles/logging.logWriter",
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
        },
        defaultResourceOptions
      ),
      ...repositories.map(
        (repository) =>
          new gcp.artifactregistry.RepositoryIamMember(
            `${name}-repository-${repository.repositoryId}-admin`,
            {
              project,
              location,
              repository: repository.name,
              role: "roles/artifactregistry.repoAdmin",
              member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
            }
          )
      ),
    ];

    this.trigger = new gcp.cloudbuild.Trigger(
      `${name}-trigger-deploy-on-merge`,
      {
        project,
        name: `${name}-deploy-on-merge`,
        github: ci,
        filename: "cloudbuild.yaml",
        serviceAccount: this.serviceAccount.id,
        substitutions: {
          _LOGS_BUCKET_NAME: logBucket.name,
          ...substitutions,
        },
      },
      {
        ...defaultResourceOptions,
        dependsOn: [
          logBucket,
          this.serviceAccount,
          ...this.customResource,
          ...this.serviceAccountProjectMembers,
        ],
      }
    );
  }
}
