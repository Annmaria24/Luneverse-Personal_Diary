import React, { useMemo, useState } from 'react';
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
  { text: "You are worthy of the love you give so freely.", author: "Unknown" },
  { text: "Your pace is perfect for your path.", author: "Unknown" },
  { text: "What you practice grows stronger.", author: "Shauna Shapiro" },
  { text: "Be proud of how far you’ve come and have faith in how far you can go.", author: "Unknown" },
  { text: "You are enough, exactly as you are.", author: "Meghan Markle" },
  { text: "One small positive thought in the morning can change your whole day.", author: "Dalai Lama" },
  { text: "You have survived 100% of your worst days.", author: "Unknown" },
  { text: "Let go of who you think you’re supposed to be; embrace who you are.", author: "Brené Brown" },
  { text: "Your heart knows the way. Run in that direction.", author: "Rumi" },
  { text: "Stars can’t shine without darkness.", author: "Unknown" },
  { text: "The wound is the place where the Light enters you.", author: "Rumi" },
  { text: "Your value doesn’t decrease based on someone’s inability to see your worth.", author: "Unknown" },
  { text: "Breathe. You are strong enough to handle this.", author: "Unknown" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Owning our story and loving ourselves through that process is the bravest thing that we’ll ever do.", author: "Brené Brown" },
  { text: "The best time for new beginnings is now.", author: "Unknown" },
  { text: "Your body hears everything your mind says. Stay kind.", author: "Unknown" },
  { text: "You carry so much love in your heart. Give some to yourself.", author: "R.Z." },
  { text: "Let yourself be silently drawn by the strange pull of what you really love.", author: "Rumi" },
  { text: "Wherever you stand, be the soul of that place.", author: "Rumi" },
  { text: "Be the love you never received.", author: "Rune Lazuli" },
  { text: "No one is you, and that is your power.", author: "Dave Grohl" },
  { text: "Your future needs you. Your past does not.", author: "Unknown" },
  { text: "You deserve the love you keep trying to give to everyone else.", author: "Unknown" },
  { text: "Let today be the day you become your own kind of beautiful.", author: "Unknown" },
  { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" },
  { text: "Be gentle with yourself; you’re doing the best you can.", author: "Paulo Coelho" },
  { text: "Courage doesn’t always roar. Sometimes it’s the quiet voice that says, ‘I will try again tomorrow.’", author: "Mary Anne Radmacher" },
  { text: "You are allowed to be both a masterpiece and a work in progress.", author: "Sophia Bush" },
  { text: "She remembered who she was and the game changed.", author: "Lalah Delia" },
  { text: "One day you will tell the story of how you overcame what you went through and it will be someone else’s survival guide.", author: "Brené Brown" },
  { text: "You are the sky. Everything else is just the weather.", author: "Pema Chödrön" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "Keep taking time for yourself until you’re you again.", author: "Lalah Delia" },
  { text: "Your light is contagious—don’t dim it to make others comfortable.", author: "Unknown" },
  { text: "You are not behind. You are exactly where you need to be.", author: "Unknown" },
  { text: "Little by little, day by day, what is meant for you will find its way.", author: "Unknown" },
  { text: "Grace means that all of your mistakes now serve a purpose instead of serving shame.", author: "Brené Brown" },
  { text: "Choose what makes your heart bloom.", author: "Unknown" },
  { text: "You can be a mess and a miracle at the same time.", author: "Unknown" },
  { text: "The fact that you’re trying is a sign of courage.", author: "Unknown" },
  { text: "Today I choose to nourish my mind with hope and my body with kindness.", author: "Unknown" },
  { text: "The more you love your decisions, the less you need others to love them.", author: "Unknown" },
  { text: "Bloom where you are planted.", author: "Saint Francis de Sales" },
  { text: "You are made of stardust and wishful thinking.", author: "Unknown" },
  { text: "Softness is not weakness; it’s strength wrapped in grace.", author: "Unknown" },
  { text: "Your sensitivity is a gift.", author: "Unknown" },
  { text: "Your joy is important.", author: "Unknown" },
  { text: "Rest is productive.", author: "Unknown" },
  { text: "The love you seek is already within you.", author: "Unknown" },
  { text: "May you attract people who speak your language so you don’t have to spend a lifetime translating your soul.", author: "Unknown" },
  { text: "Don’t shrink to fit places you’ve outgrown.", author: "Unknown" },
  { text: "Be so completely yourself that everyone else feels safe to be themselves too.", author: "Unknown" },
  { text: "Your heart is brave for continuing.", author: "Unknown" },
  { text: "I am learning to love the sound of my feet walking away from things not meant for me.", author: "A.G." },
  { text: "You can do hard things.", author: "Glennon Doyle" },
  { text: "Hope is the thing with feathers.", author: "Emily Dickinson" },
  { text: "Smile at yourself in the mirror. Do it until it feels like the truth.", author: "Unknown" },
  { text: "Your dreams are valid.", author: "Lupita Nyong'o" },
  { text: "When you can’t find the sunshine, be the sunshine.", author: "Unknown" },
  { text: "You are allowed to take up space.", author: "Unknown" },
  { text: "I am worthy of the quiet I crave.", author: "Unknown" },
  { text: "I give myself permission to rest.", author: "Unknown" },
  { text: "I honor the courage it takes to begin again.", author: "Unknown" },
];

function RelaxQuote({ embedded = false }) {
  const navigate = useNavigate();
  // Deterministic daily quote index based on date so it changes every day
  const todayIndex = useMemo(() => {
    const key = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return hash % quotes.length;
  }, []);
  const [currentIndex, setCurrentIndex] = useState(todayIndex);

  const handleNextQuote = () => {
    // Pick a different random quote from the list
    let next = currentIndex;
    if (quotes.length > 1) {
      while (next === currentIndex) {
        next = Math.floor(Math.random() * quotes.length);
      }
    }
    setCurrentIndex(next);
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
