const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_secret_token";

export default async (req, context) => {
  // 1. Handle GET requests (Webhook Verification)
  if (req.method === "GET") {
    const params = new URL(req.url).searchParams;
    const mode = params.get("hub.mode");
    const token = params.get("hub.verify_token");
    const challenge = params.get("hub.challenge");

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        return new Response(challenge, { status: 200 });
      } else {
        return new Response("Forbidden", { status: 403 });
      }
    }
    return new Response("Hello World (GET)", { status: 200 });
  }

  // 2. Handle POST requests (Incoming Messages)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Incoming Webhook:", JSON.stringify(body, null, 2));

      // Check if it's a message
      if (body.object === "whatsapp_business_account") {
        if (
          body.entry &&
          body.entry[0].changes &&
          body.entry[0].changes[0] &&
          body.entry[0].changes[0].value.messages &&
          body.entry[0].changes[0].value.messages[0]
        ) {
          const message = body.entry[0].changes[0].value.messages[0];
          const from = message.from;
          const text = message.text ? message.text.body : "Media/Other";
          
          console.log(`Received message from ${from}: ${text}`);
          
          // Here you would save to DB or trigger an event
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200 });
    } catch (error) {
      console.error("Error parsing webhook:", error);
      return new Response("Error", { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
