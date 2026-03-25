require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
    const { messages } = req.body;
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    try {
        if (key && messages) {
            let contents = [
                { role: 'user', parts: [{ text: "You are Lune, a sensitive, caring emotional support bot. Be brief (1-2 sentences)." }] },
                { role: 'model', parts: [{ text: "Understood. I am Lune." }] }
            ];

            let lastRole = 'model';
            for (const m of messages) {
                const role = (m.role === 'user' || m.type === 'user') ? 'user' : 'model';
                if (role !== lastRole) {
                    contents.push({ role, parts: [{ text: (m.content || m.text || "...") }] });
                    lastRole = role;
                }
            }

            // Try v1 -> v1beta -> gemini-1.5-flash -> gemini-pro
            const urls = [
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`,
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
                `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${key}`
            ];

            for (const url of urls) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (reply) return res.json({ reply });
                    }
                } catch (e) { /* next */ }
            }
        }
        res.status(200).json({ reply: "I hear you deeply. Take a slow, gentle breath with me." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Lune Proxy LIVE: ${PORT}`));
setInterval(() => {}, 60000); 
