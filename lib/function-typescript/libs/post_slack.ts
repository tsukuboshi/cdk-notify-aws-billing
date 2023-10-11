import * as https from 'https';

export function main(title: string, detail: string, url: string): void {
    const payload = {
        "text": title,
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": title
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":aws-logo:  *サービス別利用料金*"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": detail
                }
            },
            {
                "type": "divider"
            }
        ]
    };
    const data = JSON.stringify(payload);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = https.request(url, options, (res) => {
        console.log(`statusCode: ${res.statusCode}`)
    });

    req.on('error', (error) => {
        console.error(`Problem with request: ${error.message}`);
    });

    req.write(data);

    req.end();
}
