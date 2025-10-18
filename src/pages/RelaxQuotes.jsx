import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/RelaxMode.css';

const quotes = [
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "The present moment is the only time over which we have dominion.", author: "Thích Nhất Hạnh" },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "You are today where your thoughts have brought you; you will be tomorrow where your thoughts take you.", author: "James Allen" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Calm mind brings inner strength and self-confidence.", author: "Dalai Lama" },
];

function RelaxQuote({ embedded = false }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNextQuote = () => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
  };

  const currentQuote = quotes[currentIndex];

  const Content = (
    <>
      {!embedded && <button className="template-btn" onClick={() => navigate('/relax')}>← Back</button>}
      <h2>Inspirational Quotes</h2>
      <div className="quote-card">
        <p className="quote-text">"{currentQuote.text}"</p>
        <p className="quote-author">- {currentQuote.author}</p>
      </div>
      <button className="template-btn" onClick={handleNextQuote}>Next Quote</button>
    </>
  );

  if (embedded) return <div>{Content}</div>;
  return (
    <div className="relax-mode-page">
      <main className="relax-main">{Content}</main>
    </div>
  );
}

export default RelaxQuote;
