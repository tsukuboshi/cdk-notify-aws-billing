export async function main(
  title: string,
  detail: string,
  token: string
): Promise<void> {
  console.log("Post message to line...");
  const url = "https://notify-api.line.me/api/notify";
  const payload = new URLSearchParams({
    message: `${title}\n\n${detail}`,
  });

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: payload,
    });

    console.log(response.status);
  } catch (error) {
    console.error("Error in sending notification:", error);
  }
}
