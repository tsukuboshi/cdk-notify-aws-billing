import * as http from 'http';
import * as querystring from 'querystring';

const AWS_SESSION_TOKEN = process.env['AWS_SESSION_TOKEN'] || '';

function httpGet(url: string, params: any, headers: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const query = querystring.stringify(params);
    const options = { headers };
    http.get(`${url}?${query}`, options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });

      res.on('error', error => {
        reject(error);
      });
    });
  });
}

export async function main(secretName: string, secretKey: string): Promise<string> {
  const getSecretResponse = await httpGet(
    'http://localhost:2773/secretsmanager/get',
    {
      secretId: secretName,
    },
    {
      'X-Aws-Parameters-Secrets-Token': AWS_SESSION_TOKEN,
    }
  );

  const secretString = JSON.parse(getSecretResponse.SecureString);
  const secretValue = secretString[secretKey];
  return secretValue;
};
