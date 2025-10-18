import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- import
import './Styles/Reflect.css';

function Reflect({ embedded = false }) {
  const navigate = useNavigate(); // <-- hook
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [typing, setTyping] = useState(false);
  const [lastCategory, setLastCategory] = useState(''); // track last supportive suggestion

  const getNextSuggestion = (prev) => {
    const order = ['grounding_321', 'breathing_46', 'journaling', 'self_compassion', 'tiny_action'];
    if (!prev) return order[0];
    const idx = order.indexOf(prev);
    return order[(idx + 1) % order.length];
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { type: 'user', text: input.trim(), time: timestamp };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      // Google Generative AI (Gemini) text endpoint via fetch
      const apiKey = import.meta && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        const aiMsg = { type: 'ai', text: "I’m ready to listen. Please add your API key in the app’s .env as VITE_GEMINI_API_KEY to enable responses.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }
      const recent = [...messages, userMsg].slice(-8);
      // Heuristic: if user agrees to breathe and last AI suggested breathing, guide a short exercise directly
      const lastAiMsg = [...messages].reverse().find(m => m.type === 'ai');
      const userAffirm = /^(yes|yeah|yep|ok|okay|sure|please|let's|lets)/i.test(userMsg.text.trim());
      if (userAffirm && (lastCategory === 'breathing_46' || /breath|breathe|breathing/i.test(lastAiMsg?.text || ''))) {
        const guided = 'Great. Let’s try 4-6 breathing together. Inhale gently through your nose for 4… 1…2…3…4. Hold for a beat… and exhale slowly for 6… 1…2…3…4…5…6. How do you feel now—lighter, the same, or heavier?';
        const aiMsg = { type: 'ai', text: guided, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages((prev) => [...prev, aiMsg]);
        setLastCategory('breathing_46');
        return;
      }
      if (userAffirm && lastCategory === 'grounding_321') {
        const next = getNextSuggestion(lastCategory);
        const alt = next === 'journaling'
          ? 'Thank you for trying that. Would it help to write a few gentle lines about what felt hardest today—and one small thing you might do for yourself next?'
          : next === 'self_compassion'
          ? 'Thank you for staying with this. Try placing a hand on your chest and telling yourself: “This is hard, and I’m doing my best.” What would kindness look like for you right now?'
          : 'Let’s take one tiny step: choose a 2‑minute action (sip water, stretch, or step outside). Which one feels doable?';
        setMessages((prev) => [...prev, { type: 'ai', text: alt, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setLastCategory(next);
        return;
      }

      if (/(disappear|vanish|not exist|end it|die|suicide)/i.test(userMsg.text)) {
        const gentle = 'I’m really sorry it feels this heavy. You’re not alone here. We can take this one breath at a time 🌿. Would it feel okay to write a few lines about what hurts the most—or name one tiny kindness you can offer yourself tonight?';
        setMessages((prev) => [...prev, { type: 'ai', text: gentle, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setLastCategory('self_compassion');
        return;
      }
      const keyword = userMsg.text.toLowerCase();
      const distressed = /(sad|down|anxious|stress|tired|overwhelmed|cry|depress|lonely|confused)/i.test(keyword);
      const positive = /(better|grateful|progress|proud|relieved|improved|thank)/i.test(keyword);

      const guardrails = `Rules:\n- Be warm, gentle, 1-2 sentences max.\n- If distressed, ask a reflective or grounding question (breath, 3-2-1 senses, tiny action) and avoid repeating the same step twice in a row.\n- If positive, acknowledge and reinforce.\n- No medical, diagnostic, or crisis advice. Suggest calming or journaling instead.\n- Keep private; do not store or share.\n- Style: dreamy, soft, supportive. Avoid robotic phrasing.`;

      const nudge = distressed
        ? 'User sounds distressed. Acknowledge feeling and ask one gentle grounding or reflective question.'
        : positive
        ? 'User shared something positive. Offer brief encouragement and a small follow-up question.'
        : 'Respond briefly and naturally; ask one light follow-up to keep reflection going.';

      const contents = [
        { role: 'user', parts: [{ text: `Assistant persona: Lune. ${guardrails}\nGuidance: ${nudge}` }] },
        ...recent.map(m => ({ role: m.type === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
      ];

      const payload = { contents, generationConfig: { temperature: 0.95, topP: 0.95 } };
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let replyText = '';
      const positiveNow = /(lighter|better|calmer|ok now|fine now|improved)/i.test(userMsg.text);
      if (res.ok) {
        const data = await res.json();
        replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I’m here with you. Would you like to take a slow breath with me?';
      } else {
        // Heuristic fallback to avoid repetition and match user affect
        if (positiveNow || /grateful|better|progress|proud|relieved/i.test(userMsg.text)) {
          replyText = 'I’m glad to hear that. What felt most helpful just now—breathing, noticing, or talking it out?';
          setLastCategory('reinforce');
        } else if (/sad|down|anxious|stress|overwhelmed|lonely|confused/i.test(userMsg.text)) {
          const next = getNextSuggestion(lastCategory);
          if (next === 'journaling') {
            replyText = 'That sounds heavy. Would it help to write a few gentle lines about what’s weighing on you, or name one small thing you can do next?';
          } else if (next === 'self_compassion') {
            replyText = 'This is hard. Try a self‑kindness breath: hand on heart, slow inhale, and tell yourself “I’m doing my best.” What feels kind right now?';
          } else if (next === 'tiny_action') {
            replyText = 'One tiny step can help. Would it feel okay to sip water, stretch for 20 seconds, or step outside for fresh air?';
          } else if (next === 'breathing_46') {
            replyText = 'Let’s try a soft 4‑6 breath together—inhale 4, exhale 6. Want to try?';
          } else {
            replyText = 'Want to try a 10‑second 3‑2‑1 grounding—3 things you see, 2 you hear, 1 you feel?';
          }
          setLastCategory(next);
        } else {
          replyText = 'I’m here with you. Want to try a 10‑second pause—notice 3 things you see, 2 you hear, 1 you feel?';
          setLastCategory('grounding_321');
        }
      }

      const lastAi = [...messages].reverse().find(m => m.type === 'ai');
      if (lastAi && lastAi.text.trim() === replyText.trim()) {
        const altPayload = {
          contents: [
            { role: 'user', parts: [{ text: `${guardrails}\nPlease respond in a different way than before. Acknowledge: "${userMsg.text}". Avoid repeating earlier suggestions (last was ${lastCategory || 'none'}); offer one new gentle step or question. 1-2 sentences.` }] }
          ],
          generationConfig: { temperature: 1.0, topP: 0.95 }
        };
        const res2 = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(altPayload)
        });
        if (res2.ok) {
          const d2 = await res2.json();
          replyText = d2?.candidates?.[0]?.content?.parts?.[0]?.text || replyText;
        }
      }

      const aiMsg = { type: 'ai', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages((prev) => [...prev, aiMsg]);
      if (replyText.match(/glad|proud|helpful|great/i)) setLastCategory('reinforce');
    } catch (err) {
      console.error(err);
      const aiMsg = { type: 'ai', text: 'I’m having trouble reaching the reflection service. Please try again in a bit.' };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const Content = (
    <>
      {!embedded && <button className="back-btn" onClick={() => navigate('/relax')}>← Back</button>}
      <h2>Gentle Reflections</h2>
      <p className="reflect-subtitle">Write your thoughts and tap Send for a gentle response.</p>

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.type}`}>
            <div className="chat-text">{msg.text}</div>
            {msg.time && <span className="msg-time">{msg.time}</span>}
          </div>
        ))}
        {typing && (
          <div className="chat-message typing">
            <div className="chat-text">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="chat-input-wrapper">
        <input
          type="text"
          placeholder="Type your thoughts here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          aria-label="Message input"
        />
        <button className="send-btn" onClick={sendMessage} aria-label="Send message">Send</button>
      </div>
    </>
  );

  if (embedded) return <div>{Content}</div>;
  return (
    <div className="reflect-page">
      <main className="reflect-main">{Content}</main>
    </div>
  );
}

export default Reflect;
