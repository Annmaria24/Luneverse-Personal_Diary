import React from 'react';
import { motion } from 'framer-motion';

/**
 * RelaxHeader component - Displays the animated title and personalized greeting
 * @param {string} greeting - The personalized greeting text
 */
const RelaxHeader = ({ greeting }) => {
  return (
    <header className="text-center mb-8">
      {/* Animated title */}
      <motion.h2
        className="text-3xl md:text-4xl font-bold mb-2 tracking-wide"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        Relax Mode 🌙
      </motion.h2>
      {/* Personalized greeting */}
      <motion.p
        className="text-lg opacity-90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {greeting}
      </motion.p>
    </header>
  );
};

export default RelaxHeader;