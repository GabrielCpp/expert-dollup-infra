import * as gcp from "@pulumi/gcp";
import { expertDollupService } from "../backend/cloud-run";
import { location, host } from "../configs";
import { webappBucket } from "./webapp-bucket";

export const enableCompute = new gcp.projects.Service("EnableCompute", {
  service: "compute.googleapis.com",
});

export const ipaddress = new gcp.compute.GlobalAddress(
  "expert-dollup-webapp-ipaddress",
  {
    addressType: "EXTERNAL",
  },
  { dependsOn: [enableCompute] }
);

const endpoint_group = new gcp.compute.RegionNetworkEndpointGroup(
  "expert-dollup-webapp-epg",
  {
    networkEndpointType: "SERVERLESS",
    region: location,
    cloudRun: {
      service: expertDollupService.name,
    },
  },
  { dependsOn: [enableCompute] }
);

const service = new gcp.compute.BackendService(
  "expert-dollup-backend-service",
  {
    enableCdn: false,
    connectionDrainingTimeoutSec: 10,
    backends: [
      {
        group: endpoint_group.id,
      },
    ],
  },
  { dependsOn: [enableCompute] }
);

const https_paths = new gcp.compute.URLMap(
  "expert-dollup-https",
  {
    defaultService: webappBucket.id,
    hostRules: [
      {
        hosts: [host],
        pathMatcher: "expert-dollup",
      },
    ],
    pathMatchers: [
      {
        name: "expert-dollup",
        defaultService: webappBucket.id,
        pathRules: [
          {
            paths: ["/api/*"],
            service: service.id,
          },
          {
            paths: ["/graphql"],
            service: service.id,
          },
        ],
      },
    ],
  },
  { dependsOn: [enableCompute, webappBucket] }
);

const certificate = new gcp.compute.ManagedSslCertificate(
  "expert-dollup-webapp-certificate",
  {
    managed: {
      domains: [host],
    },
  },
  { dependsOn: [enableCompute] }
);

const https_proxy = new gcp.compute.TargetHttpsProxy(
  "expert-dollup-webapp-https-proxy",
  {
    urlMap: https_paths.selfLink,
    sslCertificates: [certificate.id],
  },
  { dependsOn: [enableCompute] }
);

export const globalForwardingRule = new gcp.compute.GlobalForwardingRule(
  "expert-dollup-webapp-https",
  {
    target: https_proxy.selfLink,
    ipAddress: ipaddress.address,
    portRange: "443",
    loadBalancingScheme: "EXTERNAL",
  },
  { dependsOn: [enableCompute] }
);
