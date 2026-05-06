import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Styles/Reflect.css';

/**
 * Gentle Reflections: A sensitive, friendly, and deeply caring chatbot.
 * Powered by: Google Gemini 1.5 (via ML Proxy: 5001)
 */
function Reflect({ embedded = false }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial welcome message from Lune
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        const welcomeMsg = {
          id: Date.now(),
          type: 'ai',
          text: "I'm so glad you're here. I'm Lune 🌙 — a quiet friend to sit with you through whatever you're feeling right now. How has your heart been today?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([welcomeMsg]);
        setIsTyping(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add User Message
    const userMsg = { id: Date.now(), type: 'user', text: userText, time: timestamp };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Proxy: Port 5001 (Secured Channel)
      const proxyUrl = 'http://localhost:5001/chat';
      
      const chatHistory = messages.slice(-15).map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...chatHistory,
            { role: 'user', content: userText }
          ]
        })
      });

      if (!res.ok) {
        throw new Error("Lune is resting for a moment.");
      }

      const data = await res.json();
      const aiReply = data.reply;

      if (!aiReply) {
        throw new Error("Lune is quiet.");
      }

      // 2. Add AI Message
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error("Lune Error:", err);
      // Sensitive fallback
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now() + 2,
          type: 'ai',
          text: "I hear you, though I'm having a little trouble finding my voice right now. Just know that I'm here, and you're not alone in this moment. Let's take a slow, gentle breath together.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 400);
    } finally {
      setIsTyping(false);
    }
  };

  const PageContent = (
    <div className={`reflect-container ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <button className="back-btn" onClick={() => navigate('/relax')}>
          <i>←</i> Your Sanctuary
        </button>
      )}

      <div className="reflect-header">
        <h2>Gentle Reflections 🌙</h2>
        <p className="reflect-subtitle">A safe harbor for your thoughts and feelings.</p>
      </div>

      <div className="chat-container">
        <div className="chat-box">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`chat-message ${msg.type}`}
              >
                <div className="chat-text">{msg.text}</div>
                <div className="msg-info">
                  <span className="sender-name">{msg.type === 'ai' ? 'Lune' : 'You'}</span>
                  <span className="msg-time">{msg.time}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <div className="typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-footer" onSubmit={sendMessage}>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder={isTyping ? "Lune is with you..." : "Tell Lune what's on your heart..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              aria-label="Message input"
            />
            <button 
              type="submit" 
              className="send-button" 
              disabled={!input.trim() || isTyping}
              aria-label="Send"
            >
              <span className="icon-send">↑</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (embedded) return <div className="reflect-embedded">{PageContent}</div>;

  return (
    <div className="reflect-page">
      <main className="reflect-main">
        {PageContent}
      </main>
    </div>
  );
}

export default Reflect;
