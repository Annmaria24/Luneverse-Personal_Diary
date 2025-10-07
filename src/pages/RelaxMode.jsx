	import React, { useMemo } from 'react';
	import { Link } from 'react-router-dom';
	import { motion } from 'framer-motion';
	import Navbar from '../components/Navbar';
	import './Styles/RelaxMode.css';

	/**
	 * RelaxMode Component - Main landing page for relaxation features
	 * Enhanced with modularity, responsiveness, animations, and code readability.
	 * Keeps fantasy calm theme with floating emojis, using a mix of CSS and Tailwind for styling.
	 */
	function RelaxMode() {
	  // Personalized greeting based on time of day
	  const greeting = useMemo(() => {
	    const hour = new Date().getHours();
	    const name = 'Ann'; // Placeholder for user name, can be made dynamic later
	    let timeGreeting;
	    if (hour < 12) timeGreeting = 'Good morning';
	    else if (hour < 17) timeGreeting = 'Good afternoon';
	    else timeGreeting = 'Good evening';
	    return `${timeGreeting}, ${name} 🌙`;
	  }, []);

	  // Feature cards configuration for modularity
	  const featureCards = [
	    { to: '/relax/breathe', emoji: '🫧', title: 'Guided Breathing', description: 'Box · Resonant · Long Exhale', titleAttr: 'Guided Breathing' },
	    { to: '/relax/sound', emoji: '🌧️', title: 'Soundscapes', description: 'Rain · Forest · Ocean', titleAttr: 'Soundscapes' },
	    { to: '/relax/quotes', emoji: '💭', title: 'Calm Quotes', description: 'Inspiring words for peace', titleAttr: 'Calm Quotes' },
	    { to: '/relax/flow', emoji: '🎨', title: 'Flow Mode', description: 'Creative visualization', titleAttr: 'Flow Mode' },
	    { to: '/relax/visuals', emoji: '🌌', title: 'Visual Calm', description: 'Aurora · Starfield · Koi', titleAttr: 'Visual Calm' },
	    { to: '/relax/reflect', emoji: '🪞', title: 'Gentle Reflections', description: 'Journaling prompts', titleAttr: 'Gentle Reflections' },
	  ];

	  // Quick templates configuration
	  const templates = [
	    { to: '/relax/breathe?preset=quick_calm', label: 'Quick Calm · 3m', aria: 'Quick Calm 3 minutes' },
	    { to: '/relax/breathe?preset=reset_5', label: 'Reset · 5m', aria: 'Reset 5 minutes' },
	    { to: '/relax/sound?preset=unwind_10', label: 'Unwind · 10m', aria: 'Unwind 10 minutes' },
	    { to: '/relax/quotes?preset=daily_inspire', label: 'Inspire · 5m', aria: 'Daily Inspiration' },
	  ];

	  return (
	    <div
	      className="relative min-h-screen"
	      style={{
	        background: 'linear-gradient(135deg, #4b0082, #c71585)',
	        color: '#f3f4ff',
	      }}
	    >
	      {/* Floating decorative elements for fantasy theme */}
	      <div className="dashboard-background">
	        <motion.div
	          className="floating-element element-1 absolute text-4xl opacity-60"
	          initial={{ y: '100vh', rotate: 0 }}
	          animate={{ y: '-10vh', rotate: 360 }}
	          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
	          style={{ left: '10%' }}
	        >
	          ✨
	        </motion.div>
	        <motion.div
	          className="floating-element element-2 absolute text-4xl opacity-60"
	          initial={{ y: '100vh', rotate: 0 }}
	          animate={{ y: '-10vh', rotate: 360 }}
	          transition={{ duration: 30, repeat: Infinity, ease: 'linear', delay: 3 }}
	          style={{ left: '70%' }}
	        >
	          🌙
	        </motion.div>
	        <motion.div
	          className="floating-element element-3 absolute text-4xl opacity-60"
	          initial={{ y: '100vh', rotate: 0 }}
	          animate={{ y: '-10vh', rotate: 360 }}
	          transition={{ duration: 28, repeat: Infinity, ease: 'linear', delay: 6 }}
	          style={{ left: '40%' }}
	        >
	          🌸
	        </motion.div>
	      </div>

	      <Navbar />

	      <main className="max-w-6xl mx-auto px-5 py-9 pb-16 relative z-10">
	        {/* Header section with animated title and personalized greeting */}
	        <header className="text-center mb-8">
	          <motion.h2
	            className="text-3xl md:text-4xl font-bold mb-2 tracking-wide"
	            initial={{ opacity: 0, y: -20 }}
	            animate={{ opacity: 1, y: 0 }}
	            transition={{ duration: 0.8, ease: 'easeOut' }}
	          >
	            Relax Mode 🌙
	          </motion.h2>
	          <motion.p
	            className="text-lg opacity-90"
	            initial={{ opacity: 0 }}
	            animate={{ opacity: 1 }}
	            transition={{ duration: 0.8, delay: 0.3 }}
	          >
	            {greeting}
	          </motion.p>
	        </header>

	        {/* Feature cards grid - responsive layout with staggered animations */}
	        <section className="mb-8">
	          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
	            {featureCards.map((card, index) => (
	              <motion.div
	                key={index}
	                initial={{ opacity: 0, y: 20 }}
	                animate={{ opacity: 1, y: 0 }}
	                transition={{
	                  duration: 0.6,
	                  delay: index * 0.1,
	                  ease: 'easeOut',
	                }}
	                whileHover={{
	                  scale: 1.05,
	                  y: -5,
	                  transition: { duration: 0.2 },
	                }}
	                whileTap={{ scale: 0.95 }}
	              >
	                <Link
	                  className="block bg-white/12 border border-white/18 rounded-xl p-4 text-inherit no-underline transition-all duration-200 hover:bg-white/18 hover:shadow-lg"
	                  to={card.to}
	                  title={card.titleAttr}
	                >
	                  <div className="text-4xl mb-2">{card.emoji}</div>
	                  <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
	                  <p className="text-sm opacity-95 mb-0">{card.description}</p>
	                </Link>
	              </motion.div>
	            ))}
	          </div>
	        </section>

	        {/* Quick access templates with animations */}
	        <motion.section
	          className="mb-6"
	          initial={{ opacity: 0, y: 20 }}
	          animate={{ opacity: 1, y: 0 }}
	          transition={{ duration: 0.6, delay: 0.8 }}
	        >
	          <h3 className="text-xl font-semibold mb-4">One-tap routines</h3>
	          <div className="flex flex-wrap gap-3">
	            {templates.map((template, index) => (
	              <motion.div
	                key={index}
	                initial={{ opacity: 0, scale: 0.9 }}
	                animate={{ opacity: 1, scale: 1 }}
	                transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
	                whileHover={{
	                  scale: 1.05,
	                  y: -2,
	                  transition: { duration: 0.2 },
	                }}
	                whileTap={{ scale: 0.95 }}
	              >
	                <Link
	                  to={template.to}
	                  className="bg-white/14 border border-white/20 text-inherit rounded-full px-4 py-2 cursor-pointer transition-all duration-200 hover:bg-white/22 hover:shadow-md no-underline"
	                  aria-label={template.aria}
	                >
	                  {template.label}
	                </Link>
	              </motion.div>
	            ))}
	          </div>
	        </motion.section>

	        {/* Footer note */}
	        <motion.section
	          initial={{ opacity: 0 }}
	          animate={{ opacity: 1 }}
	          transition={{ duration: 0.6, delay: 1.5 }}
	        >
	          <p className="text-sm opacity-75">Choose your relaxation path. All features work offline.</p>
	        </motion.section>
	      </main>
	    </div>
	  );
	}

	export default RelaxMode;


