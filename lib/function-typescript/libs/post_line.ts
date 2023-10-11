import * as https from 'https';
import * as querystring from 'querystring';

export function main(title: string, detail: string, token: string): void {
    const url = "https://notify-api.line.me/api/notify";

    const payload = querystring.stringify({
        "message": `${title}\n\n${detail}`
    });

    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            'Content-Length': Buffer.byteLength(payload),
            "Authorization": `Bearer ${token}`
        }
    };

    const req = https.request(url, options, (res) => {
        console.log(`statusCode: ${res.statusCode}`)
    });

    req.on('error', (error) => {
        console.error(`Problem with request: ${error.message}`);
    });

    req.write(payload);

    req.end();
}
