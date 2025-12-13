import axios from "axios";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export default async (req, context) => {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        return new Response("Missing Environment Variables", { status: 500 });
    }

    try {
        const body = await req.json();
        const { to, text } = body;

        if (!to || !text) {
            return new Response("Missing 'to' or 'text' fields", { status: 400 });
        }

        const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;

        const data = {
            messaging_product: "whatsapp",
            to: to,
            text: { body: text },
        };

        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        return new Response(JSON.stringify(response.data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error sending message:", error.response ? error.response.data : error.message);
        return new Response(JSON.stringify({ error: "Failed to send message" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
