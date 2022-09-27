import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { project, location, config } from "../configs";

interface FirebaseHostingArgs {
  account: {
    accountId: string;
    displayName: string;
  };
}

export class FirebaseHosting extends pulumi.ComponentResource {
  readonly serviceAccount: gcp.serviceaccount.Account;
  readonly members: pulumi.CustomResource[];
  readonly key: gcp.serviceaccount.Key;

  constructor(
    name: string,
    { account }: FirebaseHostingArgs,
    opts?: pulumi.ResourceOptions
  ) {
    const inputs: pulumi.Inputs = {
      options: opts,
    };

    super("pulumi-contrib:components:FirebaseHosting", name, inputs, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    this.serviceAccount = new gcp.serviceaccount.Account(
      `${name}-service-account`,
      {
        ...account,
        project,
      },
      defaultResourceOptions
    );

    // roles/firebase.admin

    this.members = [
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
          role: "roles/firebase.managementServiceAgent",
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
        },
        defaultResourceOptions
      ),
      /*
      new gcp.projects.IAMMember(
        `${name}-service-account-cloud-run-agent`,
        {
          role: "roles/owner",
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
          project
        },
        defaultResourceOptions
      ),
      */
      new gcp.projects.IAMMember(
        `${name}-service-account-firebase-admin`,
        {
          role: "roles/firebase.admin",
          member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
          project,
        },
        defaultResourceOptions
      ),
    ];

    this.key = new gcp.serviceaccount.Key(
      `${name}-service-account-key`,
      {
        serviceAccountId: this.serviceAccount.name,
      },
      { ...defaultResourceOptions, dependsOn: [...this.members] }
    );

    new gcp.projects.Service(
      "enable-firebase",
      {
        service: "firebase.googleapis.com",
      },
      defaultResourceOptions
    );

    new gcp.projects.Service("enable-firebase", {
      service: "firebase.googleapis.com",
    });

    /*
     new gcp.firebase.Project(
      "defaultFirebase/projectProject",
      {
        project: project,
      },
      { dependsOn: [ this.key, enableFirebase ], ...defaultResourceOptions}
    );
    */
  }
}

export const hosting = new FirebaseHosting("fireabse", {
  account: {
    accountId: "firebasemanager",
    displayName: "Firebase",
  },
});
//*/
