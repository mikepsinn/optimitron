import { createPrivateKey, createPublicKey } from "node:crypto";
import { pathToFileURL } from "node:url";

/** Validate only supplied environment configuration. No dotenv, network, or database access. */
export function checkCourtMcpOAuth(env) {
  const enabled = env.MCP_COURT_RESOURCE_ENABLED === "1";
  const pem = env.MCP_COURT_SIGNING_PRIVATE_KEY;
  const kid = env.MCP_COURT_SIGNING_KEY_ID;
  const jwks = env.MCP_COURT_SIGNING_PUBLIC_JWKS;
  if (!enabled && !pem && !kid && !jwks) {
    return { enabled: false, signingConfigured: false };
  }
  if (!pem || !kid || !jwks) throw new Error("Court signing configuration is incomplete.");

  let keys;
  try { keys = JSON.parse(jwks).keys; } catch {
    throw new Error("Court public JWKS must contain valid JSON.");
  }
  if (!Array.isArray(keys) || keys.length === 0) throw new Error("Court public JWKS must contain public RSA keys.");
  const seen = new Set();
  for (const key of keys) {
    if (!key || key.kty !== "RSA" || typeof key.kid !== "string" || !key.kid ||
        typeof key.n !== "string" || !key.n || typeof key.e !== "string" || !key.e ||
        seen.has(key.kid) || (key.alg && key.alg !== "RS256") || (key.use && key.use !== "sig")) {
      throw new Error("Court public JWKS contains an invalid or duplicate signing key.");
    }
    if (["d", "p", "q", "dp", "dq", "qi", "oth", "k"].some(member => member in key)) {
      throw new Error("Court public JWKS must not contain private key material.");
    }
    try {
      const publicKey = createPublicKey({ key, format: "jwk" });
      if ((publicKey.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) throw new Error();
    } catch {
      throw new Error("Court public JWKS contains an invalid RSA key or a modulus below 2048 bits.");
    }
    seen.add(key.kid);
  }
  const active = keys.find(key => key.kid === kid);
  if (!active) throw new Error("Court active signing key ID is absent from public JWKS.");
  let derived;
  try {
    const normalized = pem.replace(/\\n/g, "\n");
    if (!normalized.startsWith("-----BEGIN PRIVATE KEY-----")) throw new Error();
    const privateKey = createPrivateKey(normalized);
    if (privateKey.asymmetricKeyType !== "rsa") throw new Error();
    derived = createPublicKey(privateKey).export({ format: "jwk" });
  } catch {
    throw new Error("Court signing private key must be a valid PKCS8 RSA PEM.");
  }
  if (derived.n !== active.n || derived.e !== active.e) {
    throw new Error("Court signing private key does not match its public JWKS entry.");
  }
  return { enabled, signingConfigured: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = checkCourtMcpOAuth(process.env);
    console.log(`Court MCP gate: ${result.enabled ? "enabled" : "disabled"}; signing configuration: ${result.signingConfigured ? "valid" : "absent"}.`);
    console.log("No database, deployment, or remote JWKS checks were performed. This does not authorize cutover.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Court OAuth preflight failed.");
    process.exitCode = 1;
  }
}
