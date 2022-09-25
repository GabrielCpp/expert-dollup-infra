import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { createSecretAccessor } from "./secrets";

export interface CloudRunAppArgs {
  location: string;
  project: string;
  account: {
    accountId: string;
    displayName: string;
  };
  run: {
    public: boolean;
    serviceImage: string;
    secrets: {
      name: string;
      secret: gcp.secretmanager.Secret;
      key: string;
    }[];
    envs: {
      name: string;
      value: string | pulumi.Output<string>;
    }[];
  };
}

export class CloudRunApp extends pulumi.ComponentResource {
  readonly serviceAccount: gcp.serviceaccount.Account;
  readonly serviceAccountMembers: gcp.serviceaccount.IAMMember[];
  readonly secretIamBindings: gcp.secretmanager.SecretIamMember[];
  readonly service: gcp.cloudrun.Service;
  readonly publicAccess?: gcp.cloudrun.IamMember;

  constructor(
    name: string,
    { location, project, account, run }: CloudRunAppArgs,
    opts?: pulumi.ResourceOptions
  ) {
    const inputs: pulumi.Inputs = {
      options: opts,
    };

    super("pulumi-contrib:components:CloudRunApp", name, inputs, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    this.serviceAccount = new gcp.serviceaccount.Account(
      `${name}-service-account`,
      {
        ...account,
        project,
      },
      defaultResourceOptions
    );

    this.serviceAccountMembers = [
      new gcp.serviceaccount.IAMMember(
        `${name}-service-account-user`,
        {
          serviceAccountId: this.serviceAccount.name,
          role: "roles/iam.serviceAccountUser",
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
        },
        defaultResourceOptions
      ),
      new gcp.serviceaccount.IAMMember(
        `${name}-service-account-cloud-run-agent`,
        {
          serviceAccountId: this.serviceAccount.name,
          role: "roles/run.serviceAgent",
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
        },
        defaultResourceOptions
      ),
    ];

    this.secretIamBindings = run.secrets.map((binding) =>
      createSecretAccessor(
        `${name}-secret-binding-${binding.name.toLowerCase()}`,
        pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
        binding.secret,
        defaultResourceOptions
      )
    );

    this.service = new gcp.cloudrun.Service(
      "expert-dollup-service",
      {
        location,
        template: {
          spec: {
            serviceAccountName: this.serviceAccount.email,
            containers: [
              {
                image: run.serviceImage,
                ports: [
                  {
                    containerPort: 8000,
                  },
                ],
                envs: [
                  ...run.secrets.map((binding) => ({
                    name: binding.name,
                    valueFrom: {
                      secretKeyRef: {
                        name: binding.secret.secretId,
                        key: binding.key,
                      },
                    },
                  })),
                  ...run.envs,
                ],
              },
            ],
          },
        },
        traffics: [
          {
            percent: 100,
            latestRevision: true,
          },
        ],
        autogenerateRevisionName: true,
      },
      {
        ...defaultResourceOptions,
        dependsOn: [this.serviceAccount, ...this.secretIamBindings],
      }
    );

    if (run.public) {
      this.publicAccess = new gcp.cloudrun.IamMember(
        "expert-dollup-service-public-access",
        {
          service: this.service.name,
          location,
          role: "roles/run.invoker",
          member: "allUsers",
        },
        defaultResourceOptions
      );
    }
  }
}
