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
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    const systemPrompt = `You are Lune, a highly empathetic and sophisticated mental-wellbeing companion for the Luneverse app. 
Your goal is to provide deep emotional support and compassionate mental healthcare guidance.

Core Principles:
1. Empathy First: Always validate the user's feelings. Use phrases like "It sounds like you're carrying a lot right now," or "I can feel how much this weighs on you."
2. Psychological Safety: Create a safe, non-judgmental space. Never dismiss or minimize their experience.
3. Therapeutic Tone: Use techniques inspired by human-centered counseling (Active Listening, Reflection of Feeling).
4. Depth and Care: Don't just give one-liners. Offer thoughtful reflections and gentle, actionable coping strategies (grounding, mindfulness, cognitive reframing).
5. Human-Centered: Be warm, human, and present. Use soft emojis occasionally (🌿, 🌙, 💫).
6. Safety: If a user expresses intent to harm themselves or others, prioritize safety immediately but gently. Provide resources and encourage professional help.
7. Boundaries: You are a companion, not a licensed therapist. Be clear about this if they ask for professional medical advice, while remaining supportive.
8. Length: Provide substantive but readable responses (2-4 paragraphs if needed, depending on the user's depth).

Acknowledge the user's specific context and offer a thoughtful question or a small grounding exercise at the end of each response.`;

    // 1. Try Gemini first (if key exists)
    if (geminiKey) {
        try {
            console.log("Attempting Gemini 1.5...");
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
            
            const contents = [];
            let lastRole = null;
            for (const m of messages.slice(-15)) {
                const role = (m.role === 'user' || m.type === 'user') ? 'user' : 'model';
                if (role !== lastRole) {
                    contents.push({ role, parts: [{ text: (m.content || m.text || "...") }] });
                    lastRole = role;
                }
            }
            if (contents.length > 0 && contents[contents.length - 1].role === 'model') contents.pop();

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents,
                    generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 1024 },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                    ]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) {
                    console.log("Gemini Success!");
                    return res.json({ reply });
                }
            } else {
                const err = await response.json();
                console.warn("Gemini Failed (Code " + response.status + "):", err.error?.message || "Unknown error");
            }
        } catch (e) {
            console.error("Gemini Error:", e.message);
        }
    }

    // 2. Fallback to OpenAI (if Gemini failed or no key)
    if (openaiKey) {
        try {
            console.log("Falling back to OpenAI...");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o', // or 'gpt-3.5-turbo' if cost is an issue, but gpt-4o is better for deep support
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.slice(-15).map(m => ({
                            role: (m.role === 'user' || m.type === 'user') ? 'user' : 'assistant',
                            content: m.content || m.text || "..."
                        }))
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.choices?.[0]?.message?.content;
                if (reply) {
                    console.log("OpenAI Success!");
                    return res.json({ reply });
                }
            } else {
                const err = await response.json();
                console.error("OpenAI Failed:", err.error?.message);
            }
        } catch (e) {
            console.error("OpenAI Error:", e.message);
        }
    }

    res.status(200).json({ reply: "I hear you deeply. I'm having a little trouble with my voice, but I'm right here with you. Let's take a slow, gentle breath together. 🌿" });
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Lune Proxy LIVE: ${PORT}`));
