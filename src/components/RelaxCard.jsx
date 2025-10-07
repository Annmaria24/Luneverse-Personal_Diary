import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * RelaxCard component - A reusable card for relaxation features
 * @param {string} to - The route to navigate to
 * @param {string} emoji - The emoji for the card
 * @param {string} title - The title of the feature
 * @param {string} description - The description of the feature
 * @param {string} titleAttr - The title attribute for accessibility
 * @param {number} index - The index for staggered animation
 */
const RelaxCard = ({ to, emoji, title, description, titleAttr, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1, // Staggered entrance
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
        to={to}
        className="block bg-white/12 border border-white/18 rounded-xl p-4 text-inherit no-underline transition-all duration-200 hover:bg-white/18 hover:shadow-lg"
        title={titleAttr}
      >
        <div className="text-4xl mb-2">{emoji}</div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm opacity-95 mb-0">{description}</p>
      </Link>
    </motion.div>
  );
};

export default RelaxCard;