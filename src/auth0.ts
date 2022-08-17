import * as auth0 from "@pulumi/auth0";
import { host } from "./configs";
import { createPublicKey } from 'crypto'

export function getPublicKeyFromCert(cert: string) {
  return createPublicKey(cert).export({type:'spki', format:'pem'})
}

export const redirectUri = `https://${host}`;
export const auth0Frontend = new auth0.Client("expert-dollup-auth0-frontend", {
  appType: "spa",
  allowedLogoutUrls: [`https://${host}`],
  allowedOrigins: [`https://${host}`],
  callbacks: [redirectUri],
  initiateLoginUri: `https://${host}/login`,
  isFirstParty: true,
  tokenEndpointAuthMethod: 'none',
  grantTypes: [
    'implicit', 'authorization_code', 'refresh_token'
  ],
  jwtConfiguration: {
    alg: "RS256",
    lifetimeInSeconds: 84600,
    secretEncoded: true,
  },
  webOrigins: [`https://${host}`],
});
