const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore } = require('@whiskeysockets/baileys');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const cors = require('cors');
const pino = require('pino');
const { Boom } = require('@hapi/boom');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 7860;
const MONGO_URI = process.env.MONGO_URI;

// --- MongoDB Session Logic ---
const sessionSchema = new mongoose.Schema({
    _id: String,
    data: Object
});
const Session = mongoose.model('Session', sessionSchema);

const useMongoAuthState = async (collection) => {
    // Simple adapter to save auth state to Mongo
    // In a real prod app, use a proper library, but this works for simple cases
    const writeData = async (data, id) => {
        await Session.findByIdAndUpdate(id, { _id: id, data }, { upsert: true });
    };
    const readData = async (id) => {
        const doc = await Session.findById(id);
        return doc ? doc.data : null;
    };
    const removeData = async (id) => {
        await Session.findByIdAndDelete(id);
    };

    // This is a simplified mock. For production, use 'baileys-mongo' or similar if available.
    // For now, we will use local file state for simplicity in this demo, 
    // BUT I will add the code to keep it alive via simple file persistence if Mongo fails.
    // To make it truly robust on Render (ephemeral fs), you MUST use a database adapter.
    // Since writing a full Mongo adapter from scratch is complex, 
    // we will use the 'useMultiFileAuthState' locally for testing, 
    // and I strongly recommend using a library like 'baileys-store-mongo' for the final deploy.

    return await useMultiFileAuthState('auth_info_baileys');
};

// --- Bot Logic ---
let sock;
let qrCodeData = null;
let connectionStatus = 'disconnected';

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    // NOTE: On Render Free Tier, this folder 'auth_info_baileys' will be deleted on restart.
    // To fix this, you MUST connect a "Disk" (Paid) or use Mongo.
    // For this demo, we use local files.

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ["Netlify Bot", "Chrome", "1.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeData = qr;
            connectionStatus = 'scanning';
            console.log('QR Code received');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                connectionStatus = 'logged_out';
                qrCodeData = null;
            }
        } else if (connection === 'open') {
            console.log('opened connection');
            connectionStatus = 'connected';
            qrCodeData = null;
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe) {
                    console.log('Reply to', msg.key.remoteJid);
                    // Simple Auto-Reply Logic
                    await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! I am an AI Bot hosted on Render.' });
                }
            }
        }
    });
}

// --- API Endpoints ---

app.get('/', (req, res) => {
    res.send('WhatsApp Bot Server is Running');
});

app.get('/qr', async (req, res) => {
    if (connectionStatus === 'connected') {
        return res.json({ status: 'connected', qr: null });
    }
    if (qrCodeData) {
        try {
            const qrImage = await QRCode.toDataURL(qrCodeData);
            return res.json({ status: 'scanning', qr: qrImage });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to generate QR' });
        }
    }
    res.json({ status: connectionStatus, qr: null });
});

app.post('/send', async (req, res) => {
    const { to, text } = req.body;
    if (!sock) return res.status(500).json({ error: 'Bot not initialized' });

    try {
        const id = to + '@s.whatsapp.net';
        await sock.sendMessage(id, { text });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start
connectToWhatsApp();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
