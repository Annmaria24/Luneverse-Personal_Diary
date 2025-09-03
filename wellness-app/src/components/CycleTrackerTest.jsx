import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  saveCycleEntry, 
  getCycleData, 
  getCycleStats, 
  getCommonSymptoms 
} from '../services/cycleService';

function CycleTrackerTest() {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date() }]);
  };

  const runTests = async () => {
    if (!currentUser) {
      addTestResult('Authentication', false, 'No user logged in');
      return;
    }

    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Save a cycle entry
      addTestResult('Save Entry', true, 'Starting save test...');
      const testDate = new Date();
      const testEntry = {
        periodStatus: 'start',
        flow: 'medium',
        symptoms: ['cramps', 'fatigue'],
        notes: 'Test entry from cycle tracker test',
        type: 'period'
      };

      await saveCycleEntry(currentUser.uid, testDate, testEntry);
      addTestResult('Save Entry', true, 'Successfully saved test entry');

      // Test 2: Retrieve cycle data
      addTestResult('Get Data', true, 'Starting data retrieval test...');
      const cycleData = await getCycleData(currentUser.uid);
      addTestResult('Get Data', true, `Retrieved ${Object.keys(cycleData).length} entries`);

      // Test 3: Get cycle statistics
      addTestResult('Get Stats', true, 'Starting stats test...');
      const stats = await getCycleStats(currentUser.uid);
      addTestResult('Get Stats', true, `Current cycle day: ${stats.currentCycleDay}, Phase: ${stats.currentPhase}`);

      // Test 4: Get common symptoms
      addTestResult('Get Symptoms', true, 'Starting symptoms test...');
      const symptoms = await getCommonSymptoms(currentUser.uid);
      addTestResult('Get Symptoms', true, `Found ${symptoms.length} common symptoms`);

      addTestResult('All Tests', true, 'All tests completed successfully!');

    } catch (error) {
      addTestResult('Error', false, `Test failed: ${error.message}`);
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Cycle Tracker Database Test</h2>
      
      <button 
        onClick={runTests} 
        disabled={loading || !currentUser}
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
        {loading ? 'Running Tests...' : 'Run Database Tests'}
      </button>

      {!currentUser && (
        <p style={{ color: 'red' }}>Please log in to run tests</p>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Test Results:</h3>
        {testResults.map((result, index) => (
          <div 
            key={index}
            style={{
              padding: '10px',
              margin: '5px 0',
              backgroundColor: result.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px',
              color: result.success ? '#155724' : '#721c24'
            }}
          >
            <strong>{result.test}:</strong> {result.message}
            <small style={{ display: 'block', marginTop: '5px', opacity: 0.7 }}>
              {result.timestamp.toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CycleTrackerTest;