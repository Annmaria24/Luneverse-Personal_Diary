import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCycleAwareEmotionInsight } from '../services/insightService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Styles/CycleInsightsCard.css';

function CycleInsightsCard({ personalPatterns }) {
    const { currentUser, modulePreferences } = useAuth();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser || !modulePreferences?.cycleTracker) {
            setLoading(false);
            return;
        }

        const fetchInsights = async () => {
            try {
                // Fetch context-aware insights combining cycle + mood data
                const data = await getCycleAwareEmotionInsight(currentUser.uid);
                setInsights(data);
            } catch (error) {
                console.error("Error fetching insights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [currentUser, modulePreferences]);

    const getPhaseIcon = (phase) => {
        switch (phase) {
            case 'Menstrual': return '🩸';
            case 'Follicular': return '🌱';
            case 'Ovulation': return '✨';
            case 'Luteal': return '🍃';
            case 'PMS': return '☁️';
            default: return '🌸';
        }
    };

    if (!modulePreferences?.cycleTracker) return null;

    if (loading) return null;

    if (!insights || !insights.hasData) {
        return (
            <div className="cycle-insights-wrapper">
                <div className="cycle-concise-card empty">
                    <p>Track your cycle for personalized daily guidance ✨</p>
                    <button className="minimal-btn" onClick={() => navigate('/my-cycle')}>Open Tracker</button>
                </div>
            </div>
        );
    }

    // Get the most relevant personal pattern for the current phase or general dip
    const activePattern = personalPatterns?.hasData ? personalPatterns.patterns[0] : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="unified-insight-card"
            data-phase={insights.currentPhase}
        >
            <div className="insight-content-area">
                <div className="insight-header-row">
                    <span className="phase-indicator-badge">
                        {getPhaseIcon(insights.currentPhase)} Day {insights.cycleDay} · {insights.currentPhase}
                    </span>
                    
                    {insights.periodReminder && (
                        <span className="soft-reminder">📅 {insights.periodReminder}</span>
                    )}
                </div>
                
                <p className="insight-narrative">
                    {insights.insightMessage}
                </p>
            </div>

            <div className="insight-divider-v"></div>

            <div className="insight-actions-area">
                <span className="actions-label">Mindful Suggestions</span>
                <div className="action-pills-row">
                    {insights.copingSuggestions?.slice(0, 2).map((action, idx) => (
                        <button
                            key={idx}
                            className="insight-pill-btn"
                            onClick={() => action.link && navigate(action.link)}
                        >
                            {action.text}
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default CycleInsightsCard;
