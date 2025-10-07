import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * RelaxTemplates component - Displays quick access templates for one-tap routines
 */
const RelaxTemplates = () => {
  // Array of template configurations
  const templates = [
    { to: '/relax/breathe?preset=quick_calm', label: 'Quick Calm · 3m', aria: 'Quick Calm 3 minutes' },
    { to: '/relax/breathe?preset=reset_5', label: 'Reset · 5m', aria: 'Reset 5 minutes' },
    { to: '/relax/sound?preset=unwind_10', label: 'Unwind · 10m', aria: 'Unwind 10 minutes' },
    { to: '/relax/quotes?preset=daily_inspire', label: 'Inspire · 5m', aria: 'Daily Inspiration' },
  ];

  return (
    <motion.section
      className="mt-8"
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
  );
};

export default RelaxTemplates;