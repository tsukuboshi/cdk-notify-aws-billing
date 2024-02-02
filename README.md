# cdk-notify-aws-billing

## 概要

Slack/LINEのいずれかに対して、メッセージ形式でAWS利用料金を通知します。

## 構成図

![diagram](./image/diagram.drawio.png)

## デプロイ方法

1. 通知対象のアプリに応じて、以下コマンドでCDKアプリをデプロイ

- Slackの場合

``` bash
cdk deploy \
  -c slackWebhookUrlPath=/notify-aws-billing/slack-webhook-url
```

- LINEの場合

``` bash
cdk deploy \
  -c lineAccessTokenPath=/notify-aws-billing/line-access-token
```
