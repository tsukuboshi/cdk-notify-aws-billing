import json
import os
import urllib.request


def post_slack(title: str, detail: str) -> None:
    # https://api.slack.com/messaging/webhooks#getting_started
    url = get_secret(os.environ.get('SLACK_WEBHOOK_URL_PATH'), 'info')
    data = {
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
    }

    try:
        send_post_request(url, data)
    except Exception as e:
        print(e)


def post_line(title: str, detail: str) -> None:
    # https://notify-bot.line.me/doc/ja/
    line_access_token = get_secret(os.environ.get('LINE_ACCESS_TOKEN_PATH'), 'info')

    url = "https://notify-api.line.me/api/notify"
    data = {'message': f'{title}\n\n{detail}'}
    headers = {"Authorization": "Bearer %s" % line_access_token}

    try:
        send_post_request(url, data, headers)
    except Exception as e:
        print(e)


def send_post_request(url: str, data, headers={}) -> None:
    data_encoded = json.dumps(data).encode()
    req = urllib.request.Request(url, data=data_encoded, headers=headers, method='POST')
    with urllib.request.urlopen(req) as response:
        print(response.status)


def get_secret(secret_name, secret_key):
    secrets_extension_endpoint = "http://localhost:2773/secretsmanager/get?secretId=" + secret_name
    headers = {"X-Aws-Parameters-Secrets-Token": os.environ.get('AWS_SESSION_TOKEN')}
    secrets_extension_req = urllib.request.Request(secrets_extension_endpoint, headers=headers)
    with urllib.request.urlopen(secrets_extension_req) as response:
        secret_config = response.read()
    secret_json = json.loads(secret_config)['SecretString']
    secret_value = json.loads(secret_json)[secret_key]
    return secret_value