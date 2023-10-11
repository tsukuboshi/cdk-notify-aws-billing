import * as process from "process";
import { main as getBilling } from "./libs/get_billing";
import { main as getSecret } from "./libs/get_secret";
import { main as postSlack } from "./libs/post_slack";
import { main as postLine } from "./libs/post_line";

exports.handler = async function (event: any, context: any) {
    // Get the total and per-service bill, and create a message
    console.log('Get billing information...');

    try {
        let [title, detail] = await getBilling();

        // Post the message to Slack
        if (process.env['SLACK_WEBHOOK_URL_PATH']) {
            console.log('Get slack webhook url...');
            let url = await getSecret(process.env['SLACK_WEBHOOK_URL_PATH'], 'info');

            console.log('Post message to slack...');
            await postSlack(title, detail, url);
        }

        // Post the message to LINE
        if (process.env['LINE_ACCESS_TOKEN_PATH']) {
            console.log('Get line access token...');
            let token = await getSecret(process.env['LINE_ACCESS_TOKEN_PATH'], 'info');

            console.log('Post message to line...');
            await postLine(title, detail, token);
        }

    } catch (e) {
        console.log(`Exception occurred: ${e}`);
        throw e;
    }
}
