import { Duration, ScopedAws, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaPython from "@aws-cdk/aws-lambda-python-alpha";

export class NotifyAwsBillingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Parameters
    const { accountId, region } = new ScopedAws(this);
    const sysName = this.node.tryGetContext("sysName") as string;
    const notifyDaysInterval = this.node.tryGetContext(
      "notifyDaysInterval"
    ) as string;
    const slackWebhookUrlPath = this.node.tryGetContext(
      "slackWebhookUrlPath"
    ) as string | "";
    const lineAccessTokenPath = this.node.tryGetContext(
      "lineAccessTokenPath"
    ) as string | "";

    let appAccessInfo = {};
    let secretArn: string = "";

    if (slackWebhookUrlPath) {
      secretArn = `arn:aws:secretsmanager:${region}:${accountId}:secret:${slackWebhookUrlPath}-*`;
      appAccessInfo = {
        SLACK_WEBHOOK_URL_PATH: slackWebhookUrlPath,
      };
    }

    if (lineAccessTokenPath) {
      secretArn = `arn:aws:secretsmanager:${region}:${accountId}:secret:${lineAccessTokenPath}-*`;
      appAccessInfo = {
        LINE_ACCESS_TOKEN_PATH: lineAccessTokenPath,
      };
    }

    // IAM Role
    const notifyAwsBillingRole = new iam.Role(this, "notifyAwsBillingRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: `${sysName}-notify-aws-billing-role`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
      inlinePolicies: {
        NotifyAwsBilling: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["ce:GetCostAndUsage"],
              resources: ["*"],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["secretsmanager:GetSecretValue"],
              resources: [secretArn],
            }),
          ],
        }),
      },
    });

    // Lambda layer
    const paramsAndSecrets = lambda.ParamsAndSecretsLayerVersion.fromVersion(
      lambda.ParamsAndSecretsVersions.V1_0_103,
      {
        cacheSize: 500,
        logLevel: lambda.ParamsAndSecretsLogLevel.DEBUG,
      }
    );

    // Lambda function
    const notifyAwsBillingFunction = new lambdaPython.PythonFunction(
      this,
      "function",
      {
        functionName: `${sysName}-notify-aws-billing-function`,
        entry: "lib/function",
        runtime: lambda.Runtime.PYTHON_3_10,
        role: notifyAwsBillingRole,
        timeout: Duration.seconds(10),
        logRetention: 365,
        environment: appAccessInfo,
        paramsAndSecrets: paramsAndSecrets,
      }
    );

    // EventBridge rule
    new events.Rule(this, "notifyAwsBillingRule", {
      ruleName: `${sysName}-notify-aws-billing-rule`,
      schedule: events.Schedule.cron({
        day: `*/${notifyDaysInterval}`,
        hour: "0",
        minute: "0",
      }),
      targets: [new targets.LambdaFunction(notifyAwsBillingFunction)],
    });
  }
}
