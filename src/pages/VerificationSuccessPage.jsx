import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase/config';
import { applyActionCode, onAuthStateChanged } from 'firebase/auth';
import { createUserProfile, updateLastLogin } from '../services/userService';
import './Styles/VerificationSuccessPage.css';

function VerificationSuccessPage() {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');

      if (mode === 'verifyEmail' && oobCode) {
        try {
          // Apply the email verification code
          await applyActionCode(auth, oobCode);

          setStatus('success');
          setMessage('✅ Email verified successfully! Setting up your account...');

          // Clear any pending verification email from localStorage
          localStorage.removeItem('pendingVerificationEmail');

          // Wait for auth state to update and then redirect to dashboard
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.emailVerified) {
              try {
                // Create user profile in database
                await createUserProfile(user);
                await updateLastLogin(user.uid);
                console.log('✅ User profile created after verification');

                // Redirect to dashboard
                setTimeout(() => {
                  navigate('/dashboard');
                }, 1000);
              } catch (error) {
                console.error('Error creating user profile:', error);
                // Still redirect to dashboard even if profile creation fails
                setTimeout(() => {
                  navigate('/dashboard');
                }, 1000);
              }
              unsubscribe();
            }
          });
          
        } catch (error) {
          console.error('Email verification error:', error);
          setStatus('error');
          
          if (error.code === 'auth/expired-action-code') {
            setMessage('❌ Verification link has expired. Please request a new one.');
          } else if (error.code === 'auth/invalid-action-code') {
            setMessage('❌ Invalid verification link. Please request a new one.');
          } else {
            setMessage('❌ Email verification failed. Please try again.');
          }
          
          // Redirect to signup after 3 seconds on error
          setTimeout(() => {
            navigate('/signup');
          }, 3000);
        }
      } else {
        setStatus('error');
        setMessage('❌ Invalid verification link.');
        setTimeout(() => {
          navigate('/signup');
        }, 3000);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="verification-success-page">
      <div className="verification-success-container">
        <div className="verification-success-card">
          <div className="verification-icon">
            {status === 'verifying' && '⏳'}
            {status === 'success' && '✅'}
            {status === 'error' && '❌'}
          </div>
          
          <h1>Email Verification</h1>
          <p className={`message ${status}`}>{message}</p>
          
          {status === 'success' && (
            <div className="success-info">
              <p>Redirecting to your dashboard...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="error-info">
              <p>Redirecting to signup page...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerificationSuccessPage;
