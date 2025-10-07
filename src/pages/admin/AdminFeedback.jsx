import React, { useEffect, useState } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { getAllUserFeedback, updateFeedbackStatus } from '../../services/feedbackService';
import './Styles/Admin.css';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'user'

  useEffect(() => {
    const load = async () => {
      // Load admin feedback
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'admin' })));

      // Load user feedback
      try {
        const userFeedback = await getAllUserFeedback();
        setUserFeedbacks(userFeedback.map(f => ({ ...f, type: 'user' })));
      } catch (error) {
        console.error('Error loading user feedback:', error);
        setUserFeedbacks([]);
      }

      setLoading(false);
    };
    load();
  }, []);

  const createFeedback = async (e) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;
    await addDoc(collection(db, 'feedback'), {
      message: newFeedback.trim(),
      createdAt: serverTimestamp(),
    });
    setNewFeedback('');
    const snap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
    setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const toggleStatus = async (f, status) => {
    await setDoc(doc(db, 'feedback', f.id), { status }, { merge: true });
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const adminList = feedbacks.filter(f => statusFilter === 'all' ? true : (f.status || 'open') === statusFilter);
  const userList = userFeedbacks.filter(f => statusFilter === 'all' ? true : (f.status || 'new') === statusFilter);
  const currentList = activeTab === 'admin' ? adminList : userList;

  return (
    <div className="admin-wrap">
      <AdminNavbar />
      <div className="admin-container">
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Feedback & Suggestions</h2>

        {/* Tab Navigation */}
        <div className="feedback-tabs" style={{ marginBottom: 24 }}>
          <button
            className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin Feedback ({feedbacks.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            User Feedback ({userFeedbacks.length})
          </button>
        </div>

        <div className="panel">
          {activeTab === 'admin' && (
            <>
              <form onSubmit={createFeedback} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input className="input" value={newFeedback} onChange={e => setNewFeedback(e.target.value)} placeholder="Add a suggestion or feedback (test input)" />
                <button className="button primary" type="submit">Add</button>
              </form>
            </>
          )}

          <div className="filters">
            <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="reviewed">Reviewed</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th className="th">
                    {activeTab === 'admin' ? 'Message' : 'Feedback'}
                  </th>
                  {activeTab === 'user' && <th className="th">Type</th>}
                  {activeTab === 'user' && <th className="th">Category</th>}
                  {activeTab === 'user' && <th className="th">Rating</th>}
                  <th className="th">Status</th>
                  <th className="th">Created</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map(f => (
                  <tr key={f.id}>
                    <td className="td" style={{ maxWidth: activeTab === 'admin' ? 520 : 300 }}>
                      {activeTab === 'admin' ? f.message : f.message}
                    </td>
                    {activeTab === 'user' && (
                      <td className="td">
                        <span className="feedback-type" style={{
                          background: f.type === 'bug' ? '#fee2e2' : f.type === 'feature' ? '#dcfce7' : '#f3e8ff',
                          color: f.type === 'bug' ? '#dc2626' : f.type === 'feature' ? '#16a34a' : '#7c3aed',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {f.type}
                        </span>
                      </td>
                    )}
                    {activeTab === 'user' && <td className="td">{f.category || 'general'}</td>}
                    {activeTab === 'user' && <td className="td">
                      {f.rating ? '⭐'.repeat(f.rating) : '—'}
                    </td>}
                    <td className="td">{f.status || (activeTab === 'admin' ? 'open' : 'new')}</td>
                    <td className="td">
                      {f.createdAt?.toDate ? f.createdAt.toDate().toLocaleString() :
                       f.timestamp?.toDate ? f.timestamp.toDate().toLocaleString() : '—'}
                    </td>
                    <td className="td" style={{ display: 'flex', gap: 6 }}>
                      {activeTab === 'admin' ? (
                        <>
                          <button className="button" onClick={() => toggleStatus(f, 'open')}>Open</button>
                          <button className="button success" onClick={() => toggleStatus(f, 'in_progress')}>In Progress</button>
                          <button className="button primary" onClick={() => toggleStatus(f, 'done')}>Done</button>
                        </>
                      ) : (
                        <>
                          <button className="button" onClick={() => updateFeedbackStatus(f.id, 'new')}>New</button>
                          <button className="button success" onClick={() => updateFeedbackStatus(f.id, 'reviewed')}>Reviewed</button>
                          <button className="button primary" onClick={() => updateFeedbackStatus(f.id, 'responded')}>Responded</button>
                          <button className="button" onClick={() => updateFeedbackStatus(f.id, 'closed')}>Close</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!currentList.length && (
                  <tr>
                    <td className="td" colSpan={activeTab === 'admin' ? 4 : 7} style={{ opacity: 0.8, textAlign: 'center' }}>
                      No {activeTab} feedback found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedback;


