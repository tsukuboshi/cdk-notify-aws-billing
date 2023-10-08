import boto3
import logging
import os
from libs import get_billing, post_app

logger = logging.getLogger()
logger.setLevel(logging.getLevelName(os.getenv("LOG_LEVEL", "INFO")))


def handler(event, context) -> None:
    client = boto3.client('ce', region_name='us-east-1')

    # 合計とサービス毎の請求額を取得し、メッセージを作成する
    logger.info('Get billing information...')
    total_billing = get_billing.get_total_billing(client)
    service_billings = get_billing.get_service_billings(client)
    (title, detail) = get_billing.get_message(total_billing, service_billings)

    # Slackにメッセージを投稿する
    if os.environ.get('SLACK_WEBHOOK_URL_PATH'):
        logger.info('Post message to Slack...')
        post_app.post_slack(title, detail)

    # LINEにメッセージを投稿する
    if os.environ.get('LINE_ACCESS_TOKEN_PATH'):
        logger.info('Post message to LINE...')
        post_app.post_line(title, detail)
