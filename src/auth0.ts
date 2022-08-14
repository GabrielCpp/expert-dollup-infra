import * as auth0 from "@pulumi/auth0";

export const frontend = new auth0.Client("expert-dollup-auth0-frontend", {
  appType: "spa",
  allowedLogoutUrls: ["https://predykt.com/logout"],
  allowedOrigins: ["https://predykt.com"],
  callbacks: ["https://predykt.com/api/auth/callback"],
  initiateLoginUri: "https://predykt.com/login",
  isFirstParty: true,
  jwtConfiguration: {
    alg: "RS256",
    lifetimeInSeconds: 84600,
    secretEncoded: true,
  },
  webOrigins: ["https://predykt.com"],
});
