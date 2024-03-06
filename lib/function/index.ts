import { Handler } from "aws-lambda";
import * as process from "process";
import { main as getBilling } from "./libs/get_billing";
import { main as getSecret } from "./libs/get_secret";
import { main as postLine } from "./libs/post_line";
import { main as postSlack } from "./libs/post_slack";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler: Handler = async (event, context) => {
  try {
    // Get the total and per-service bill, and create a message
    const [title, detail] = await getBilling();

    // Output the message to CloudWatch Logs (Only for debugging)
    console.debug(`title: ${title}`);
    console.debug(`detail: ${detail}`);

    // If the SLACK_WEBHOOK_URL_PATH environment variable is set
    if (process.env["SLACK_WEBHOOK_URL_PATH"]) {
      // Get Slack Webhook URL
      const url = await getSecret(
        process.env["SLACK_WEBHOOK_URL_PATH"],
        "info",
      );

      // Post the message to Slack
      await postSlack(title, detail, url);
    }

    // If the LINE_ACCESS_TOKEN_PATH environment variable is set
    if (process.env["LINE_ACCESS_TOKEN_PATH"]) {
      // Get LINE Access Token
      const token = await getSecret(
        process.env["LINE_ACCESS_TOKEN_PATH"],
        "info",
      );
      // Post the message to LINE
      await postLine(title, detail, token);
    }
  } catch (e) {
    console.log(`Exception occurred: ${e}`);
    throw e;
  }
};
