export default async () => {
  const token = process.env.BOT_TOKEN;

  if (!token) {
    return new Response("BOT_TOKEN پیدا نشد", {
      status: 500
    });
  }

  const webhookUrl =
    "https://gotham-date.netlify.app/.netlify/functions/telegram";

  const response = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: webhookUrl
      })
    }
  );

  const result = await response.text();

  return new Response(result, {
    status: response.status,
    headers: {
      "Content-Type": "application/json"
    }
  });
};
