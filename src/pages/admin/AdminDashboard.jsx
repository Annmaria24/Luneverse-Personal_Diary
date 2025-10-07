import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, getCountFromServer, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import { Link } from 'react-router-dom';
import './Styles/Admin.css';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { getRecentUsers, getSessionSeries, getTotals, recomputeActivityAverages, getSignupSeries, seedSampleSessionsForCurrentUser } from '../../services/adminStatsService';
import { getActiveUsersCount, getSessionDurationDistribution, getTopActiveUsers, getDailySessionCounts } from '../../services/enhancedActivityService';
import { getFeedbackStats } from '../../services/feedbackService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [avgSessionMins, setAvgSessionMins] = useState(null);
  const [siteName, setSiteName] = useState('Luneverse');
  const [recentUsers, setRecentUsers] = useState([]);
  const [series, setSeries] = useState([]);
  const [signupSeries, setSignupSeries] = useState([]);

  // Enhanced session tracking states
  const [activeUsers, setActiveUsers] = useState(0);
  const [sessionDistribution, setSessionDistribution] = useState({});
  const [topUsers, setTopUsers] = useState([]);
  const [dailySessions, setDailySessions] = useState([]);

  // User feedback states
  const [feedbackStats, setFeedbackStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    feedbackTypes: {},
    recentFeedback: []
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        console.log('Loading admin stats...');
        
        const totals = await getTotals();
        console.log('Totals:', totals);
        setTotalUsers(totals.users);
        setAvgSessionMins(Math.round((totals.averageSessionMinutes || 0) * 10) / 10);

        const cfgSnap = await getDoc(doc(db, 'config', 'app'));
        if (cfgSnap.exists()) setSiteName(cfgSnap.data().siteName || 'Luneverse');

        const users = await getRecentUsers();
        console.log('Recent users:', users);
        setRecentUsers(users);
        
        let s = await getSessionSeries(14);
        console.log('Session series:', s);
        setSeries(s);
        setSessions(s.reduce((acc, cur) => acc + (cur.value || 0), 0));
        // If there is no session data at all, seed a small set so charts are not empty in fresh envs
        if (s.every(p => (p.value || 0) === 0)) {
          console.log('No session data found, seeding sample sessions...');
          try {
            await seedSampleSessionsForCurrentUser(3, 2);
            s = await getSessionSeries(14);
            setSeries(s);
            setSessions(s.reduce((acc, cur) => acc + (cur.value || 0), 0));
            const totalsAfter = await getTotals();
            setAvgSessionMins(Math.round((totalsAfter.averageSessionMinutes || 0) * 10) / 10);
          } catch (seedErr) {
            console.error('Seeding sessions failed:', seedErr);
          }
        }
        
        const signups = await getSignupSeries(14);
        console.log('Signup series:', signups);
        setSignupSeries(signups);

        // Load enhanced session tracking data
        console.log('Loading enhanced session data...');
        const activeUsersData = await getActiveUsersCount();
        setActiveUsers(activeUsersData.activeUsers);

        const distribution = await getSessionDurationDistribution(null, 7);
        setSessionDistribution(distribution.distribution);

        const topActiveUsers = await getTopActiveUsers(7, 5);
        setTopUsers(topActiveUsers.topUsers);

        const dailySessionData = await getDailySessionCounts(7);
        setDailySessions(dailySessionData);

        // Load user feedback statistics
        console.log('Loading feedback statistics...');
        const feedbackData = await getFeedbackStats();
        setFeedbackStats(feedbackData);

      } catch (error) {
        console.error('Error loading admin stats:', error);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="admin-wrap">
      <AdminNavbar />
      <div className="admin-container">
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>Overview for {siteName}</p>

        <div className="cards-grid">
          <div className="card">
            <div className="card-title">Total Users</div>
            <div className="card-value">{totalUsers}</div>
          </div>
          <div className="card">
            <div className="card-title">Sessions (14d)</div>
            <div className="card-value">{sessions}</div>
          </div>
          <div className="card">
            <div className="card-title">Avg Session (mins)</div>
            <div className="card-value">{avgSessionMins ?? '—'}</div>
          </div>
          <div className="card">
            <div className="card-title">Active Users (15m)</div>
            <div className="card-value">{activeUsers}</div>
          </div>
          <div className="card">
            <div className="card-title">User Feedback</div>
            <div className="card-value">{feedbackStats.totalFeedback}</div>
          </div>
          <div className="card">
            <div className="card-title">Avg Rating</div>
            <div className="card-value">{feedbackStats.averageRating > 0 ? feedbackStats.averageRating.toFixed(1) + '⭐' : '—'}</div>
          </div>
          <div className="card">
            <div className="card-title">Quick Links</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Link to="/admin/users" style={{ color: '#a7c5ff' }}>Users</Link>
              <Link to="/admin/feedback" style={{ color: '#a7c5ff' }}>Feedback</Link>
              <Link to="/admin/settings" style={{ color: '#a7c5ff' }}>Settings</Link>
            </div>
          </div>
        </div>

        <div className="two-col">
          <div className="panel">
            <h3>User Sessions (last 14 days)</h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <Line
                data={{
                  labels: series.map(d => d.date.slice(5)),
                  datasets: [{
                    label: 'Sessions',
                    data: series.map(d => d.value),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    tension: 0.4,
                    fill: true
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      labels: { color: '#e6e9f5' },
                      display: false
                    } 
                  },
                  scales: {
                    x: { 
                      ticks: { color: '#a7b0d0' }, 
                      grid: { color: '#1e2a55' },
                      title: { display: true, text: 'Date', color: '#a7b0d0' }
                    },
                    y: { 
                      ticks: { color: '#a7b0d0' }, 
                      grid: { color: '#1e2a55' },
                      title: { display: true, text: 'Sessions', color: '#a7b0d0' },
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="panel">
            <h3>Signups (last 14 days)</h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <Line
                data={{
                  labels: signupSeries.map(d => d.date.slice(5)),
                  datasets: [{
                    label: 'Signups',
                    data: signupSeries.map(d => d.value),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    tension: 0.4,
                    fill: true
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      labels: { color: '#e6e9f5' },
                      display: false
                    } 
                  },
                  scales: {
                    x: { 
                      ticks: { color: '#a7b0d0' }, 
                      grid: { color: '#1e2a55' },
                      title: { display: true, text: 'Date', color: '#a7b0d0' }
                    },
                    y: { 
                      ticks: { color: '#a7b0d0' }, 
                      grid: { color: '#1e2a55' },
                      title: { display: true, text: 'Signups', color: '#a7b0d0' },
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Session Tracking Section */}
        <div className="three-col" style={{ marginTop: 24 }}>
          <div className="panel">
            <h3>Session Duration Distribution (7d)</h3>
            <div style={{ height: '250px', position: 'relative' }}>
              <Doughnut
                data={{
                  labels: Object.keys(sessionDistribution),
                  datasets: [{
                    data: Object.values(sessionDistribution),
                    backgroundColor: [
                      '#ef4444', // 0-5min - red
                      '#f97316', // 5-15min - orange
                      '#eab308', // 15-30min - yellow
                      '#22c55e', // 30-60min - green
                      '#3b82f6'  // 60min+ - blue
                    ],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: '#e6e9f5' },
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="panel">
            <h3>Daily Sessions (7d)</h3>
            <div style={{ height: '250px', position: 'relative' }}>
              <Bar
                data={{
                  labels: dailySessions.map(d => d.date.slice(5)),
                  datasets: [{
                    label: 'Sessions',
                    data: dailySessions.map(d => d.count),
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: '#8b5cf6',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      ticks: { color: '#a7b0d0' },
                      grid: { color: '#1e2a55' }
                    },
                    y: {
                      ticks: { color: '#a7b0d0' },
                      grid: { color: '#1e2a55' },
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="panel">
            <h3>Top Active Users (7d)</h3>
            <div style={{ height: '250px', overflowY: 'auto' }}>
              {topUsers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topUsers.map((user, index) => (
                    <div key={user.uid} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '6px',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#8b5cf6',
                          color: index < 3 ? '#000' : '#fff',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ color: '#e6e9f5', fontSize: '14px' }}>
                          {user.uid.substring(0, 8)}...
                        </span>
                      </div>
                      <span style={{ color: '#a7b0d0', fontSize: '14px', fontWeight: '600' }}>
                        {user.count} sessions
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#a7b0d0', marginTop: '20px' }}>
                  No active users data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Feedback Section */}
        <div className="two-col" style={{ marginTop: 24 }}>
          <div className="panel">
            <h3>Feedback Types Distribution</h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <Doughnut
                data={{
                  labels: Object.keys(feedbackStats.feedbackTypes),
                  datasets: [{
                    data: Object.values(feedbackStats.feedbackTypes),
                    backgroundColor: [
                      '#ef4444', // bug - red
                      '#22c55e', // feature - green
                      '#3b82f6', // improvement - blue
                      '#f59e0b', // question - yellow
                      '#8b5cf6'  // other - purple
                    ],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: '#e6e9f5' },
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="panel">
            <h3>Recent User Feedback</h3>
            <div style={{ height: '300px', overflowY: 'auto' }}>
              {feedbackStats.recentFeedback.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {feedbackStats.recentFeedback.map((feedback, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(139, 92, 246, 0.1)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            background: feedback.type === 'bug' ? '#fee2e2' : feedback.type === 'feature' ? '#dcfce7' : '#f3e8ff',
                            color: feedback.type === 'bug' ? '#dc2626' : feedback.type === 'feature' ? '#16a34a' : '#7c3aed',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {feedback.type}
                          </span>
                          {feedback.rating && (
                            <span style={{ color: '#ffd700', fontSize: '14px' }}>
                              {'⭐'.repeat(feedback.rating)}
                            </span>
                          )}
                        </div>
                        <span style={{ color: '#a7b0d0', fontSize: '12px' }}>
                          {feedback.timestamp?.toDate ? feedback.timestamp.toDate().toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <p style={{ color: '#e6e9f5', fontSize: '14px', margin: 0, lineHeight: '1.4' }}>
                        {feedback.message.length > 100 ? feedback.message.substring(0, 100) + '...' : feedback.message}
                      </p>
                      {feedback.category && (
                        <span style={{ color: '#a7b0d0', fontSize: '12px', textTransform: 'capitalize' }}>
                          Category: {feedback.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#a7b0d0', marginTop: '20px' }}>
                  No recent feedback available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Recent Users</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="button primary" onClick={async () => {
                const r = await recomputeActivityAverages();
                setAvgSessionMins(Math.round((r.averageSessionMinutes || 0) * 10) / 10);
              }}>Recompute Averages</button>
              <button className="button success" onClick={async () => {
                // Refresh all data
                const totals = await getTotals();
                setTotalUsers(totals.users);
                setAvgSessionMins(Math.round((totals.averageSessionMinutes || 0) * 10) / 10);
                setRecentUsers(await getRecentUsers());
                const s = await getSessionSeries(14);
                setSeries(s);
                setSessions(s.reduce((acc, cur) => acc + (cur.value || 0), 0));
                setSignupSeries(await getSignupSeries(14));
              }}>Refresh Data</button>
              <button className="button" onClick={async () => {
                // Seed sample sessions for the current user to populate charts in dev
                try {
                  await seedSampleSessionsForCurrentUser(7, 3);
                  const s = await getSessionSeries(14);
                  setSeries(s);
                  setSessions(s.reduce((acc, cur) => acc + (cur.value || 0), 0));
                  const totals = await getTotals();
                  setAvgSessionMins(Math.round((totals.averageSessionMinutes || 0) * 10) / 10);
                } catch (e) {
                  console.error('Failed to seed sessions:', e);
                }
              }}>Seed Sessions</button>
              <button className="button" onClick={() => {
                // Generate sample data for testing
                const sampleSeries = [];
                const sampleSignups = [];
                for (let i = 13; i >= 0; i--) {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  const dateStr = date.toISOString().slice(0, 10);
                  sampleSeries.push({ date: dateStr, value: Math.floor(Math.random() * 10) + 1 });
                  sampleSignups.push({ date: dateStr, value: Math.floor(Math.random() * 5) });
                }
                setSeries(sampleSeries);
                setSignupSeries(sampleSignups);
                setSessions(sampleSeries.reduce((acc, cur) => acc + cur.value, 0));
                setAvgSessionMins(Math.floor(Math.random() * 30) + 10);
              }}>Generate Sample Data</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Email</th>
                  <th className="th">Name</th>
                  <th className="th">Joined</th>
                  <th className="th">Admin</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id}>
                    <td className="td">{u.email}</td>
                    <td className="td">{u.displayName || '—'}</td>
                    <td className="td">{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : '—'}</td>
                    <td className="td">{u.isAdmin ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {!recentUsers.length && (
                  <tr><td className="td" colSpan={4} style={{ opacity: 0.8, textAlign: 'center' }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


