import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmotionalInsights } from '../services/insightService';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Styles/CycleInsightsCard.css';

function CycleInsightsCard() {
    const { currentUser, modulePreferences } = useAuth();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser || !modulePreferences?.cycleTracker) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const insightData = await getEmotionalInsights(currentUser.uid);
                setInsights(insightData);
            } catch (error) {
                console.error("Error fetching cycle insights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, modulePreferences]);

    if (!modulePreferences?.cycleTracker) return null;
    if (loading) return null;

    if (!insights || !insights.hasData) {
        return (
            <div className="cycle-insights-wrapper">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="daily-guidance-card empty">
                    <p>Track your cycle for personalized daily guidance ✨</p>
                    <button className="setup-link" onClick={() => navigate('/my-cycle')}>Open Tracker</button>
                </motion.div>
            </div>
        );
    }

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

    const getActionIcon = (text) => {
        const t = text.toLowerCase();
        if (t.includes('breath')) return '🫧';
        if (t.includes('journal') || t.includes('reflection')) return '📝';
        if (t.includes('art') || t.includes('paint') || t.includes('flow')) return '🎨';
        if (t.includes('affirmation')) return '✨';
        if (t.includes('sound')) return '🌧️';
        if (t.includes('quote')) return '💭';
        return '💫';
    };

    return (
        <div className="cycle-insights-wrapper">
            <h4 className="section-label-minimal">Daily Cycle & Emotional Insight</h4>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="daily-guidance-card"
            >
                <div className="guidance-grid-focused">

                    {/* Section 1: Emotional Insight */}
                    <div className="guidance-col-wide insight-col">
                        <div className="icon-circle">🔮</div>
                        <div className="col-text">
                            <p className="short-insight">{insights.forecastingText}</p>
                        </div>
                    </div>

                    {/* Section 2: Suggested Activity */}
                    <div className="guidance-col-narrow actions-col">
                        <div className="icon-circle">✨</div>
                        <div className="col-text">
                            <p className="actions-label">Suggested Activity</p>
                            <div className="pills-container-mini">
                                {insights.copingSuggestions?.slice(0, 2).map((action, idx) => (
                                    <Link to={action.link} className="guidance-pill" key={idx}>
                                        <span className="pill-ico">{getActionIcon(action.text)}</span>
                                        <span className="pill-txt">{action.text}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}

export default CycleInsightsCard;
