import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DonutChart from '../components/charts/DonutChart';
import LineBarTimeline from '../components/charts/LineBarTimeline';
import ProgressDonut from '../components/charts/ProgressDonut';
import { getMoodStats } from '../services/moodService';
import { getRecentCycles } from '../services/cycleService';
import { calculatePregnancyWeek } from '../services/pregnancyService';
import { getUserSettings } from '../services/userService';

const Insights = () => {
  const { currentUser } = useAuth();
  const [moodStats, setMoodStats] = useState({ moodDistribution: {} });
  const [cycles, setCycles] = useState([]);
  const [pregWeek, setPregWeek] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const ms = await getMoodStats(currentUser.uid, 'month', new Date());
      setMoodStats(ms);
      const rc = await getRecentCycles(currentUser.uid, 6);
      setCycles(rc);
      const settings = await getUserSettings(currentUser.uid);
      if (settings?.conceptionDate) setPregWeek(calculatePregnancyWeek(settings.conceptionDate, true));
      else if (settings?.dueDate) setPregWeek(calculatePregnancyWeek(settings.dueDate, false));
    })();
  }, [currentUser]);

  const moods = [
    { name: 'Happy', color: '#10b981' },
    { name: 'Loved', color: '#f59e0b' },
    { name: 'Calm', color: '#06b6d4' },
    { name: 'Neutral', color: '#6b7280' },
    { name: 'Sad', color: '#3b82f6' },
    { name: 'Frustrated', color: '#ef4444' },
    { name: 'Crying', color: '#8b5cf6' },
    { name: 'Tired', color: '#64748b' },
    { name: 'Grateful', color: '#84cc16' },
    { name: 'Anxious', color: '#f97316' }
  ];

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-main">
        <div className="features-grid">
          <div className="feature-card">
            <h3>Mood Distribution (Month)</h3>
            <DonutChart
              data={Object.entries(moodStats.moodDistribution || {}).map(([label, pct]) => ({
                label,
                value: parseFloat(pct),
                color: (moods.find(m => m.name === label) || {}).color || '#8b5cf6'
              }))}
              innerRadiusPct={62}
              centerLabel={`n=${moodStats.totalEntries || 0}`}
            />
          </div>
          <div className="feature-card">
            <h3>Recent Cycle Timeline</h3>
            <LineBarTimeline data={cycles} />
          </div>
          <div className="feature-card">
            <h3>Pregnancy Progress</h3>
            <ProgressDonut valuePct={(pregWeek/40)*100} label={`Week ${pregWeek} of 40`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;



