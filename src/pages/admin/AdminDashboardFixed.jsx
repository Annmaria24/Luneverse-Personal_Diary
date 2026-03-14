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
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

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
  
  const { toasts, showSuccess, showError, removeToast } = useToast();

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


        <div className="panel" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Recent Users</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="button primary" 
                onClick={async () => {
                  try {
                    console.log('Recomputing averages...');
                    const r = await recomputeActivityAverages();
                    setAvgSessionMins(Math.round((r.averageSessionMinutes || 0) * 10) / 10);
                    showSuccess('Averages recomputed successfully!');
                  } catch (error) {
                    console.error('Error recomputing averages:', error);
                    showError('Failed to recompute averages: ' + error.message);
                  }
                }}
              >
                Recompute Averages
              </button>
              <button 
                className="button success" 
                onClick={async () => {
                  try {
                    console.log('Refreshing data...');
                    const totals = await getTotals();
                    setTotalUsers(totals.users);
                    setAvgSessionMins(Math.round((totals.averageSessionMinutes || 0) * 10) / 10);
                    setRecentUsers(await getRecentUsers());
                    const s = await getSessionSeries(14);
                    setSeries(s);
                    setSessions(s.reduce((acc, cur) => acc + (cur.value || 0), 0));
                    setSignupSeries(await getSignupSeries(14));
                    showSuccess('Data refreshed successfully!');
                  } catch (error) {
                    console.error('Error refreshing data:', error);
                    showError('Failed to refresh data: ' + error.message);
                  }
                }}
              >
                Refresh Data
              </button>
              <button 
                className="button" 
                onClick={async () => {
                  try {
                    console.log('Seeding sample sessions...');
                    await seedSampleSessionsForCurrentUser(7, 3);
                    const s = await getSessionSeries(14);
                    setSeries(s);
                    setSessions(s.reduce((acc, cur) => acc + (cur.value || 0), 0));
                    const totals = await getTotals();
                    setAvgSessionMins(Math.round((totals.averageSessionMinutes || 0) * 10) / 10);
                    showSuccess('Sample sessions seeded successfully!');
                  } catch (e) {
                    console.error('Failed to seed sessions:', e);
                    showError('Failed to seed sessions: ' + e.message);
                  }
                }}
              >
                Seed Sessions
              </button>
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default AdminDashboardFixed;
