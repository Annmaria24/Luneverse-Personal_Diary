// Firebase Authentication Error Messages
export const getAuthErrorMessage = (error) => {
  const errorCode = error.code;
  
  switch (errorCode) {
    // Authentication Errors
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please try logging in instead or use a different email.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password with at least 6 characters.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    
    case 'auth/requires-recent-login':
      return 'Please log in again to complete this action.';
    
    case 'auth/email-not-verified':
      return 'Please verify your email address before logging in. Check your inbox for the verification link.';
    
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please try again.';
    
    case 'auth/invalid-verification-id':
      return 'Invalid verification ID. Please try again.';
    
    case 'auth/missing-verification-code':
      return 'Please enter the verification code.';
    
    case 'auth/missing-verification-id':
      return 'Verification ID is missing. Please try again.';
    
    case 'auth/code-expired':
      return 'Verification code has expired. Please request a new one.';
    
    case 'auth/invalid-action-code':
      return 'Invalid action code. Please request a new verification link.';
    
    case 'auth/expired-action-code':
      return 'This link has expired. Please request a new one.';
    
    case 'auth/invalid-continue-uri':
      return 'Invalid redirect URL. Please try again.';
    
    case 'auth/missing-continue-uri':
      return 'Redirect URL is missing. Please try again.';
    
    case 'auth/unauthorized-continue-uri':
      return 'Unauthorized redirect URL. Please contact support.';
    
    case 'auth/invalid-dynamic-link-domain':
      return 'Invalid dynamic link domain. Please contact support.';
    
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with a different account.';
    
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email but different sign-in method. Please try signing in with the original method.';
    
    case 'auth/invalid-phone-number':
      return 'Invalid phone number. Please enter a valid phone number.';
    
    case 'auth/missing-phone-number':
      return 'Phone number is required.';
    
    case 'auth/quota-exceeded':
      return 'Too many requests. Please try again later.';
    
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please try again.';
    
    case 'auth/invalid-app-credential':
      return 'Invalid app credential. Please contact support.';
    
    case 'auth/invalid-tenant-id':
      return 'Invalid tenant ID. Please contact support.';
    
    case 'auth/tenant-id-mismatch':
      return 'Tenant ID mismatch. Please contact support.';
    
    case 'auth/unsupported-tenant-operation':
      return 'This operation is not supported for this tenant.';
    
    case 'auth/invalid-recipient-email':
      return 'Invalid recipient email. Please contact support.';
    
    case 'auth/invalid-sender':
      return 'Invalid sender. Please contact support.';
    
    case 'auth/invalid-message-payload':
      return 'Invalid message payload. Please contact support.';
    
    case 'auth/invalid-multi-factor-session':
      return 'Invalid multi-factor session. Please try again.';
    
    case 'auth/missing-multi-factor-info':
      return 'Multi-factor information is missing. Please try again.';
    
    case 'auth/invalid-multi-factor-hint':
      return 'Invalid multi-factor hint. Please try again.';
    
    case 'auth/missing-multi-factor-hint':
      return 'Multi-factor hint is missing. Please try again.';
    
    case 'auth/invalid-multi-factor-auth-factor':
      return 'Invalid multi-factor authentication factor.';
    
    case 'auth/missing-multi-factor-auth-factor':
      return 'Multi-factor authentication factor is missing.';
    
    case 'auth/invalid-multi-factor-auth-factor-hint':
      return 'Invalid multi-factor authentication factor hint.';
    
    case 'auth/missing-multi-factor-auth-factor-hint':
      return 'Multi-factor authentication factor hint is missing.';
    
    case 'auth/invalid-multi-factor-auth-factor-hint-uid':
      return 'Invalid multi-factor authentication factor hint UID.';
    
    case 'auth/missing-multi-factor-auth-factor-hint-uid':
      return 'Multi-factor authentication factor hint UID is missing.';
    
    case 'auth/invalid-multi-factor-auth-factor-hint-phone-number':
      return 'Invalid multi-factor authentication factor hint phone number.';
    
    case 'auth/missing-multi-factor-auth-factor-hint-phone-number':
      return 'Multi-factor authentication factor hint phone number is missing.';
    
    case 'auth/invalid-multi-factor-auth-factor-hint-display-name':
      return 'Invalid multi-factor authentication factor hint display name.';
    
    case 'auth/missing-multi-factor-auth-factor-hint-display-name':
      return 'Multi-factor authentication factor hint display name is missing.';
    
    case 'auth/invalid-multi-factor-auth-factor-hint-photo-url':
      return 'Invalid multi-factor authentication factor hint photo URL.';
    
    case 'auth/missing-multi-factor-auth-factor-hint-photo-url':
      return 'Multi-factor authentication factor hint photo URL is missing.';
    
    case 'auth/invalid-multi-factor-auth-factor-hint-provider-id':
      return 'Invalid multi-factor authentication factor hint provider ID.';
    
    case 'auth/missing-multi-factor-auth-factor-hint-provider-id':
      return 'Multi-factor authentication factor hint provider ID is missing.';
    
    case 'auth/invalid-multi-factor-auth-factor-hint-uid':
      return 'Invalid multi-factor authentication factor hint UID.';
    
    case 'auth/missing-multi-factor-auth-factor-hint-uid':
      return 'Multi-factor authentication factor hint UID is missing.';
    
    // Firestore Errors
    case 'permission-denied':
      return 'You do not have permission to perform this action. Please contact support if this persists.';
    
    case 'unavailable':
      return 'Service is temporarily unavailable. Please try again in a few moments.';
    
    case 'unauthenticated':
      return 'You must be logged in to perform this action. Please sign in and try again.';
    
    case 'not-found':
      return 'The requested resource was not found.';
    
    case 'already-exists':
      return 'This resource already exists.';
    
    case 'failed-precondition':
      return 'The operation failed due to a precondition. Please try again.';
    
    case 'aborted':
      return 'The operation was aborted. Please try again.';
    
    case 'out-of-range':
      return 'The operation is out of range. Please try again.';
    
    case 'unimplemented':
      return 'This operation is not implemented. Please contact support.';
    
    case 'internal':
      return 'An internal error occurred. Please try again later.';
    
    case 'data-loss':
      return 'Data loss occurred. Please contact support.';
    
    case 'resource-exhausted':
      return 'Resource limit exceeded. Please try again later.';
    
    case 'cancelled':
      return 'The operation was cancelled. Please try again.';
    
    case 'deadline-exceeded':
      return 'The operation timed out. Please try again.';
    
    case 'invalid-argument':
      return 'Invalid argument provided. Please check your input and try again.';
    
    case 'not-found':
      return 'The requested resource was not found.';
    
    case 'already-exists':
      return 'This resource already exists.';
    
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    
    case 'resource-exhausted':
      return 'Resource limit exceeded. Please try again later.';
    
    case 'failed-precondition':
      return 'The operation failed due to a precondition. Please try again.';
    
    case 'aborted':
      return 'The operation was aborted. Please try again.';
    
    case 'out-of-range':
      return 'The operation is out of range. Please try again.';
    
    case 'unimplemented':
      return 'This operation is not implemented. Please contact support.';
    
    case 'internal':
      return 'An internal error occurred. Please try again later.';
    
    case 'unavailable':
      return 'Service is temporarily unavailable. Please try again in a few moments.';
    
    case 'data-loss':
      return 'Data loss occurred. Please contact support.';
    
    case 'unauthenticated':
      return 'You must be logged in to perform this action. Please sign in and try again.';
    
    case 'cancelled':
      return 'The operation was cancelled. Please try again.';
    
    case 'deadline-exceeded':
      return 'The operation timed out. Please try again.';
    
    case 'invalid-argument':
      return 'Invalid argument provided. Please check your input and try again.';
    
    // Default fallback
    default:
      console.error('Unhandled error code:', errorCode, error);
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
};

// Helper function to get user-friendly error messages
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred.';
  
  // Check if it's a Firebase error
  if (error.code && error.code.startsWith('auth/')) {
    return getAuthErrorMessage(error);
  }
  
  // Check if it's a Firestore error
  if (error.code && error.code.startsWith('permission-denied')) {
    return 'You do not have permission to perform this action. Please contact support if this persists.';
  }
  
  // Generic error handling
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};
