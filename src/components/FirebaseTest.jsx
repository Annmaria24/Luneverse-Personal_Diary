import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

function FirebaseTest() {
  const { currentUser } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testFirebaseConnection = async () => {
    setLoading(true);
    setTestResult('');

    try {
      // Test 1: Check if user is authenticated
      if (!currentUser) {
        setTestResult('❌ No user authenticated');
        return;
      }
      setTestResult('✅ User authenticated: ' + currentUser.email + '\n');

      // Test 2: Test basic Firestore write
      const testCollection = collection(db, 'test');
      const testDoc = await addDoc(testCollection, {
        userId: currentUser.uid,
        message: 'Test message',
        timestamp: new Date()
      });
      setTestResult(prev => prev + '✅ Firestore write successful: ' + testDoc.id + '\n');

      // Test 3: Test basic Firestore read
      const q = query(testCollection, where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      setTestResult(prev => prev + '✅ Firestore read successful: ' + snapshot.size + ' documents\n');

      // Test 4: Test cycle collection access
      const cycleCollection = collection(db, 'cycleEntries');
      const cycleQuery = query(cycleCollection, where('userId', '==', currentUser.uid));
      const cycleSnapshot = await getDocs(cycleQuery);
      setTestResult(prev => prev + '✅ Cycle collection access successful: ' + cycleSnapshot.size + ' documents\n');

      setTestResult(prev => prev + '\n🎉 All Firebase tests passed!');

    } catch (error) {
      console.error('Firebase test error:', error);
      setTestResult(prev => prev + '\n❌ Firebase test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Firebase Connection Test</h2>
      
      <button 
        onClick={testFirebaseConnection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#7133d6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Test Firebase Connection'}
      </button>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-line',
        minHeight: '100px'
      }}>
        {testResult || 'Click the button to test Firebase connection...'}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Current User:</strong> {currentUser ? currentUser.email : 'Not logged in'}</p>
        <p><strong>User ID:</strong> {currentUser ? currentUser.uid : 'N/A'}</p>
      </div>
    </div>
  );
}

export default FirebaseTest;