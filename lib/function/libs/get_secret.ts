import { encode } from "querystring";

export async function main(secretName: string, secretKey: string) {
  console.log("Get secrets...");

  const queryparams = encode({ secretId: secretName });

  const headers: Record<string, string> = {};
  const awsSessionToken = process.env.AWS_SESSION_TOKEN;
  if (awsSessionToken) {
    headers["X-Aws-Parameters-Secrets-Token"] = awsSessionToken;
  }

  const secrets = await fetch(
    `http://localhost:2773/secretsmanager/get?${queryparams}`,
    { headers }
  )
    .then((res) => res.json())
    .catch((err) => console.error(err));

  if (!secrets) {
    return;
  }

  const secretString = JSON.parse(secrets.SecretString);
  const secretValue = secretString[secretKey];
  return secretValue;
}
