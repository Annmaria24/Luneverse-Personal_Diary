import React, { useEffect, useRef, useState } from 'react';
import './Styles/Reflect.css';

function RelaxChatbot({ onClose }) {
  const [messages, setMessages] = useState([
    { type: 'ai', text: 'Hi, I\'m Lune 🌙. I\'m here with you. What\'s on your mind?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const memoryKey = 'relax_chat_memory_v1';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // load memory
  useEffect(() => {
    try {
      const saved = localStorage.getItem(memoryKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(memoryKey, JSON.stringify(messages.slice(-30))); } catch {}
  }, [messages]);

  const basePrompt = `You are Lune, an empathetic mental-wellbeing companion in the Luneverse app.
Core principles:
- Lead with warmth, validation, and psychological safety.
- Avoid medical directives; offer gentle, actionable coping ideas.
- Encourage professional help when appropriate.
- Keep replies 3–5 short sentences, human, and compassionate.
- Use soft emoji occasionally (🌿, 🌸, 💫).
- Offer grounding, paced breathing (inhale 4, exhale 6), values check-in, affirmations, or micro-journaling when it fits.
- Ask one thoughtful, open question.

Safety:
If the user mentions self-harm/suicide or harm to others, prioritize safety, express care, and suggest contacting a trusted person and local emergency services immediately.`;

  const crisisPatterns = [/suicid(e|al)/i, /kill\s*myself/i, /end\s*my\s*life/i, /self[-\s]*harm/i, /hurt\s*myself/i, /can't\s*go\s*on|cant\s*go\s*on/i];

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { type: 'user', text, time: ts };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    // crisis check
    if (crisisPatterns.some((p) => p.test(text))) {
      setMessages((m) => [...m, { type: 'ai', text: "Thank you for sharing this with me. Your safety matters deeply. If you're in danger or thinking of harming yourself, please consider reaching out to local emergency services or a trusted person right now. I can stay with you and we can try a few calm breaths together — inhale 4, exhale 6 🌿.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setTyping(false);
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setMessages((m) => [...m, { type: 'ai', text: "Please add VITE_GEMINI_API_KEY in your .env to enable Lune's responses.", time: ts }]);
        setTyping(false);
        return;
      }

      const recent = [...messages, userMsg].slice(-12);
      const contents = [
        { role: 'user', parts: [{ text: basePrompt }] },
        ...recent.map(m => ({ role: m.type === 'user' ? 'user' : 'model', parts: [{ text: m.text }]}))
      ];
      const payload = { contents, generationConfig: { temperature: 0.7, topP: 0.9 } };
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      let reply = '';
      if (res.ok) {
        const data = await res.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      if (!reply) reply = 'I'm here with you 💫. Want to try a tiny grounding together — notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste?';

      // avoid echo / repetition
      const lastAi = [...messages].reverse().find(m => m.type === 'ai');
      if (lastAi && lastAi.text.trim() === reply.trim()) {
        reply = 'That matters. What would feel most supportive right now — a few breaths, writing a few lines, or simply sitting together for a moment? 🌿';
      }

      setMessages((m) => [...m, { type: 'ai', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (e) {
      setMessages((m) => [...m, { type: 'ai', text: 'Having a little trouble connecting. We can pause for a breath and try again in a moment 🌸.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{ type: 'ai', text: 'Hi again 🌙. What would feel supportive to talk about right now?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  };


  return (
    <div className="reflect-page">
      <main className="reflect-main">
        <h2>Gentle Reflections 💫</h2>
        <p className="reflect-subtitle">Write your thoughts and tap Send for a gentle response.</p>

        <div className="chat-box">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.type}`}>
              <div className="chat-text">{m.text}</div>
              {m.time && <span className="msg-time">{m.time}</span>}
            </div>
          ))}
          {typing && (
            <div className="chat-message typing"><div className="chat-text"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div></div>
          )}
          <div ref={endRef}></div>
        </div>

        <div className="chat-input-wrapper">
          <button className="send-btn" onClick={clearChat} aria-label="Clear chat" style={{ background: 'rgba(236,72,153,0.45)' }}>Clear</button>
          <input
            type="text"
            placeholder="Type your thoughts here…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            aria-label="Message input"
          />
          <button className="send-btn" onClick={handleSend} aria-label="Send message">Send</button>
        </div>

      <div className="suggestions-row" style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="template-btn" onClick={() => setInput('Could we try a 5–4–3–2–1 grounding exercise together?')}>Grounding 5‑4‑3‑2‑1</button>
        <button className="template-btn" onClick={() => setInput('Can you guide me through paced breathing (inhale 4, exhale 6)?')}>Breathing 4‑6</button>
        <button className="template-btn" onClick={() => setInput('Could you share a gentle self-affirmation for me right now?')}>Gentle Affirmation</button>
        <button className="template-btn" onClick={() => setInput('Can I have a short reflective journal prompt?')}>Journal Prompt</button>
      </div>
      </main>
    </div>
  );
}

export default RelaxChatbot;