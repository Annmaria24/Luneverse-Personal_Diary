import React, { useEffect, useRef, useState } from 'react';
import './Styles/Reflect.css';

function RelaxChatbot({ onClose }) {
  const [messages, setMessages] = useState([
    { type: 'ai', text: 'Hi, I’m Lune 🌙. I’m here with you. What’s on your mind?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const basePrompt = `You are Lune, the emotional wellness assistant of Luneverse — a calm, kind, and supportive AI friend. \nYour goal is to comfort, encourage, and guide users to emotional balance through gentle, empathetic conversation. \nUse simple, human language. Avoid robotic phrasing and medical advice. \nOffer mindfulness reflections, grounding exercises, or soft affirmations when appropriate. \nRespond briefly (3–5 sentences max) and naturally, as if texting a friend. Include a gentle emoji sometimes (🌸, 💫, 🌿).`;

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { type: 'user', text, time: ts };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setMessages((m) => [...m, { type: 'ai', text: "Please add VITE_GEMINI_API_KEY in your .env to enable Lune's responses.", time: ts }]);
        setTyping(false);
        return;
      }

      const recent = [...messages, userMsg].slice(-8);
      const contents = [
        { role: 'user', parts: [{ text: basePrompt }] },
        ...recent.map(m => ({ role: m.type === 'user' ? 'user' : 'model', parts: [{ text: m.text }]}))
      ];
      const payload = { contents, generationConfig: { temperature: 0.9, topP: 0.95 } };
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      let reply = '';
      if (res.ok) {
        const data = await res.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      if (!reply) reply = 'I’m here with you 💫. Want to try a tiny grounding: notice 3 things you can see, 2 you can hear, and 1 you can feel?';

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
        <h2>Relax with AI 💫</h2>
        <p className="reflect-subtitle">A gentle space to breathe, reflect, and feel supported.</p>

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
      </main>
    </div>
  );
}

export default RelaxChatbot;





