export async function main(
  title: string,
  detail: string,
  url: string
): Promise<void> {
  console.log("Post message to slack...");
  const payload = {
    text: title,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":aws-logo:  *サービス別利用料金*",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: detail,
        },
      },
      {
        type: "divider",
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(response.status);
  } catch (error) {
    console.error("Error in sending Slack notification:", error);
  }
}
