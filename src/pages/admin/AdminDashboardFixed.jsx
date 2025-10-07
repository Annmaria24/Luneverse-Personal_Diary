import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, getCountFromServer, doc, getDoc, query, where } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import { Link } from 'react-router-dom';
import './Styles/Admin.css';
import { getRecentUsers, getSessionSeries, getTotals, recomputeActivityAverages, getSignupSeries, seedSampleSessionsForCurrentUser } from '../../services/adminStatsService';
import { getFeedbackStats } from '../../services/feedbackService';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const AdminDashboardFixed = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [avgSessionMins, setAvgSessionMins] = useState(null);
  const [siteName, setSiteName] = useState('Luneverse');
  const [recentUsers, setRecentUsers] = useState([]);
  const [series, setSeries] = useState([]);
  const [signupSeries, setSignupSeries] = useState([]);
  const [adminBreakdown, setAdminBreakdown] = useState({ admins: 0, users: 0 });
  const [feedbackStats, setFeedbackStats] = useState({ totalFeedback: 0, averageRating: 0, feedbackTypes: {}, recentFeedback: [] });

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

        // Admin vs Users breakdown using count aggregation
        try {
          const adminsCountSnap = await getCountFromServer(query(collection(db, 'users'), where('isAdmin', '==', true)));
          const totalSnap = await getCountFromServer(collection(db, 'users'));
          const admins = adminsCountSnap.data().count || 0;
          const total = totalSnap.data().count || 0;
          setAdminBreakdown({ admins, users: Math.max(0, total - admins) });
        } catch (e) {
          // Fallback: estimate from recent users list
          const admins = users.filter(u => u.isAdmin).length;
          setAdminBreakdown({ admins, users: Math.max(0, totalUsers - admins) });
        }

        let s = await getSessionSeries(14);
        console.log('Session series:', s);
        setSeries(s);
        setSessions(s.reduce((acc, cur) => acc + (cur.value || 0), 0));
        if (s.every(p => (p.value || 0) === 0)) {
          try {
            await seedSampleSessionsForCurrentUser(3, 2);
            s = await getSessionSeries(14);
            setSeries(s);
            setSessions(s.reduce((acc, cur) => acc + (cur.value || 0), 0));
            const totalsAfter = await getTotals();
            setAvgSessionMins(Math.round((totalsAfter.averageSessionMinutes || 0) * 10) / 10);
          } catch (e) {
            console.error('Seeding sessions failed:', e);
          }
        }

        const signups = await getSignupSeries(14);
        console.log('Signup series:', signups);
        setSignupSeries(signups);

        // Load user feedback statistics (useful chart)
        try {
          const fb = await getFeedbackStats();
          setFeedbackStats(fb);
        } catch (e) {
          console.warn('Could not load feedback stats:', e?.message);
        }

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
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: '#a7b0d0' }, grid: { color: '#1e2a55' } },
                    y: { ticks: { color: '#a7b0d0' }, grid: { color: '#1e2a55' }, beginAtZero: true }
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
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: '#a7b0d0' }, grid: { color: '#1e2a55' } },
                    y: { ticks: { color: '#a7b0d0' }, grid: { color: '#1e2a55' }, beginAtZero: true }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="two-col" style={{ marginTop: 24 }}>
          <div className="panel">
            <h3>User Feedback Types</h3>
            <div style={{ height: '260px', position: 'relative' }}>
              <Doughnut
                data={{
                  labels: Object.keys(feedbackStats.feedbackTypes),
                  datasets: [{
                    data: Object.values(feedbackStats.feedbackTypes),
                    backgroundColor: ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: '#e6e9f5' }, position: 'bottom' } }
                }}
              />
              <div style={{ marginTop: 12, color: '#a7b0d0' }}>
                <span>Total feedback: {feedbackStats.totalFeedback}</span>
                <span style={{ marginLeft: 12 }}>Avg rating: {feedbackStats.averageRating > 0 ? feedbackStats.averageRating.toFixed(1) + '⭐' : '—'}</span>
              </div>
            </div>
          </div>
          <div className="panel">
            <h3>Recent User Feedback</h3>
            <div style={{ height: '260px', overflowY: 'auto' }}>
              {feedbackStats.recentFeedback.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {feedbackStats.recentFeedback.map((f, i) => (
                    <div key={i} style={{ padding: 10, background: 'rgba(139, 92, 246, 0.08)', borderRadius: 8, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ textTransform: 'capitalize', color: '#e6e9f5' }}>{f.type}</span>
                        <span style={{ color: '#a7b0d0', fontSize: 12 }}>{f.timestamp?.toDate ? f.timestamp.toDate().toLocaleDateString() : '—'}</span>
                      </div>
                      <div style={{ color: '#a7b0d0', fontSize: 14 }}>
                        {f.message?.length > 100 ? f.message.slice(0, 100) + '…' : f.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#a7b0d0', marginTop: 20 }}>No feedback yet</div>
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

export default AdminDashboardFixed;
