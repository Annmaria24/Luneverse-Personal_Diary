import React from 'react';
import { motion } from 'framer-motion';

/**
 * FloatingEmojis component - Renders animated floating decorative emojis
 * for the fantasy calm theme in RelaxMode.
 */
const FloatingEmojis = () => {
  // Array of floating emoji configurations with predefined positions and animations
  const emojis = [
    {
      emoji: '✨',
      initialX: '10%',
      duration: 25,
      delay: 0,
      scale: 1,
    },
    {
      emoji: '🌙',
      initialX: '70%',
      duration: 30,
      delay: 3,
      scale: 1.2,
    },
    {
      emoji: '🌸',
      initialX: '40%',
      duration: 28,
      delay: 6,
      scale: 0.9,
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {emojis.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl opacity-60"
          style={{
            left: item.initialX,
            transform: `scale(${item.scale})`,
          }}
          initial={{
            y: '100vh',
            rotate: 0,
          }}
          animate={{
            y: '-10vh',
            rotate: 360,
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: item.delay,
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingEmojis;