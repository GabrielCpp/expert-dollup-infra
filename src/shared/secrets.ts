import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export function createSecretAccessor(
  name: string,
  member: pulumi.Output<string>,
  secret: gcp.secretmanager.Secret,
  opts: pulumi.ResourceOptions
) {
  return new gcp.secretmanager.SecretIamMember(
    `${name}-secret-accessor-iam-binding`,
    {
      role: "roles/secretmanager.secretAccessor",
      project: secret.project,
      secretId: secret.id,
      member,
    },
    { dependsOn: [secret], ...opts }
  );
}
