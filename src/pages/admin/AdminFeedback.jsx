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
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const openFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
    
    // Mark as opened if it's new
    if (feedback.status === 'new' || !feedback.status) {
      updateFeedbackStatus(feedback.id, 'opened');
    }
  };

  const closeFeedback = () => {
    setSelectedFeedback(null);
    setShowDetailModal(false);
  };

  const markAsReviewed = async () => {
    if (selectedFeedback) {
      await updateFeedbackStatus(selectedFeedback.id, 'reviewed');
      // Refresh the list
      const userFeedback = await getAllUserFeedback();
      setUserFeedbacks(userFeedback.map(f => ({ ...f, type: 'user' })));
      // Update selected feedback
      setSelectedFeedback({ ...selectedFeedback, status: 'reviewed' });
    }
  };

  const adminList = feedbacks.filter(f => statusFilter === 'all' ? true : (f.status || 'new') === statusFilter);
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
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="feedback-list">
              {currentList.map(f => (
                <div 
                  key={f.id} 
                  className={`feedback-item ${f.status === 'new' || !f.status ? 'unread' : ''}`}
                  onClick={() => openFeedback(f)}
                  style={{
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: f.status === 'new' || !f.status ? '#f8fafc' : 'white',
                    borderLeft: f.status === 'new' || !f.status ? '4px solid #3b82f6' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = f.status === 'new' || !f.status ? '#f8fafc' : 'white';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: f.status === 'new' || !f.status ? '600' : '400',
                        fontSize: '16px',
                        marginBottom: '8px',
                        color: f.status === 'new' || !f.status ? '#1f2937' : '#6b7280'
                      }}>
                        {f.message.length > 100 ? f.message.substring(0, 100) + '...' : f.message}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
                        <span>
                          {f.createdAt?.toDate ? f.createdAt.toDate().toLocaleDateString() :
                           f.timestamp?.toDate ? f.timestamp.toDate().toLocaleDateString() : '—'}
                        </span>
                        {activeTab === 'user' && f.type && (
                          <span style={{
                            background: f.type === 'bug' ? '#fee2e2' : f.type === 'feature' ? '#dcfce7' : '#f3e8ff',
                            color: f.type === 'bug' ? '#dc2626' : f.type === 'feature' ? '#16a34a' : '#7c3aed',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {f.type}
                          </span>
                        )}
                        {activeTab === 'user' && f.rating && (
                          <span>⭐ {f.rating}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {f.status === 'new' || !f.status ? (
                        <span style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          animation: 'pulse 2s infinite'
                        }}>
                          NEW
                        </span>
                      ) : (
                        <span style={{
                          background: f.status === 'reviewed' ? '#10b981' : '#6b7280',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {f.status?.toUpperCase() || 'NEW'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!currentList.length && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#6b7280',
                  fontSize: '16px'
                }}>
                  No {activeTab} feedback found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={closeFeedback}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90vw',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                Feedback Details
              </h3>
              <button 
                onClick={closeFeedback}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '16px', 
                lineHeight: '1.6', 
                color: '#1f2937',
                marginBottom: '16px'
              }}>
                {selectedFeedback.message}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  <strong>Date:</strong> {selectedFeedback.createdAt?.toDate ? selectedFeedback.createdAt.toDate().toLocaleString() :
                   selectedFeedback.timestamp?.toDate ? selectedFeedback.timestamp.toDate().toLocaleString() : '—'}
                </span>
                {selectedFeedback.type && (
                  <span style={{
                    background: selectedFeedback.type === 'bug' ? '#fee2e2' : selectedFeedback.type === 'feature' ? '#dcfce7' : '#f3e8ff',
                    color: selectedFeedback.type === 'bug' ? '#dc2626' : selectedFeedback.type === 'feature' ? '#16a34a' : '#7c3aed',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {selectedFeedback.type}
                  </span>
                )}
                {selectedFeedback.rating && (
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    <strong>Rating:</strong> ⭐ {selectedFeedback.rating}
                  </span>
                )}
                {selectedFeedback.category && (
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    <strong>Category:</strong> {selectedFeedback.category}
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {selectedFeedback.status !== 'reviewed' && (
                <button 
                  className="button success"
                  onClick={markAsReviewed}
                  style={{ marginRight: 'auto' }}
                >
                  Mark as Reviewed
                </button>
              )}
              <button 
                className="button"
                onClick={closeFeedback}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;


