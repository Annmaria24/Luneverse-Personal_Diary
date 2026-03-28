import React, { useEffect, useState } from 'react';
import { analyzeDepressionRisk } from '../services/wellnessService';
import './Styles/WellnessStatusCard.css';

const WellnessStatusCard = ({ userId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!userId) return;
      try {
        const result = await analyzeDepressionRisk(userId);
        setAnalysis(result);
      } catch (error) {
        console.error("Error fetching wellness analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [userId]);

  if (loading || dismissed || !analysis) return null;

  const { riskLevel, reasoning, recommendation } = analysis;

  // Use empathetic colors based on risk
  const getCardStyle = () => {
    switch (riskLevel) {
      case 'HIGH': return 'risk-high';
      case 'MODERATE': return 'risk-moderate';
      default: return 'risk-low';
    }
  };

  const getIcon = () => {
    switch (riskLevel) {
      case 'HIGH': return '💜';
      case 'MODERATE': return '✨';
      default: return '🌿';
    }
  };

  return (
    <div className={`wellness-status-card ${getCardStyle()}`}>
      <div className="wellness-card-header">
        <span className="wellness-icon">{getIcon()}</span>
        <div className="wellness-title-group">
          <h4>Mental Wellness Status</h4>
          <span className="wellness-tag">{riskLevel === 'HIGH' ? 'Support available' : 'Wellness insight'}</span>
        </div>
        <button className="wellness-close" onClick={() => setDismissed(true)}>✕</button>
      </div>
      <div className="wellness-card-body">
        <p className="wellness-reasoning">{reasoning}</p>
        <p className="wellness-recommendation">{recommendation}</p>
      </div>
      {riskLevel !== 'LOW' && (
        <div className="wellness-card-footer">
          <small>This is a rule-based insight, not a medical diagnosis.</small>
        </div>
      )}
    </div>
  );
};

export default WellnessStatusCard;
