import React, { useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import { db } from '../../firebase/config';
import { collection, getDocs, orderBy, query, doc, setDoc } from 'firebase/firestore';
import './Styles/Admin.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Preferred: ordered by createdAt
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        // Fallback: unordered full read
        try {
          const snap = await getDocs(collection(db, 'users'));
          setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (inner) {
          console.error('Failed to fetch users:', inner);
          setError(inner?.message || 'Failed to fetch users');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => (u.email || '').toLowerCase().includes(q) || (u.displayName || '').toLowerCase().includes(q));
  }, [search, users]);

  return (
    <div className="admin-wrap">
      <AdminNavbar />
      <div className="admin-container">
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Users</h2>
        <div className="panel">
          <div className="filters">
            <input className="input" placeholder="Search by email or name" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div style={{ color: '#fca5a5' }}>{error}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Email</th>
                  <th className="th">Display Name</th>
                  <th className="th">Created</th>
                  <th className="th">Admin</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td className="td">{u.email}</td>
                    <td className="td">{u.displayName || '—'}</td>
                    <td className="td">{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : '—'}</td>
                    <td className="td">
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={!!u.isAdmin}
                          onChange={async (e) => {
                            const next = e.target.checked;
                            await setDoc(doc(db, 'users', u.id), { isAdmin: next }, { merge: true });
                            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isAdmin: next } : x));
                          }}
                        />
                        <span>{u.isAdmin ? 'Admin' : 'User'}</span>
                      </label>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td className="td" colSpan={4} style={{ opacity: 0.8 }}>No results.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;


