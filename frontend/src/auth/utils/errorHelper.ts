/**
 * Translates Supabase and network errors into user-friendly messages.
 * Gracefully handles the GoTrue/Supabase network error quirk where a failed request throws a message of "{}" or "Failed to fetch".
 */
export const getFriendlyErrorMessage = (err: any, fallback: string): string => {
  if (!err) return fallback;
  
  let message = '';
  if (typeof err === 'string') {
    message = err;
  } else if (err.message && typeof err.message === 'string') {
    message = err.message;
  } else if (err.error_description && typeof err.error_description === 'string') {
    message = err.error_description;
  }

  // Check for empty, "{}" or standard network fetch failure
  if (!message || message === '{}' || message.toLowerCase().includes('failed to fetch')) {
    return fallback || 'An unexpected error occurred. Please try again.';
  }



  // Translate specific codes or phrases
  if (message.includes('Invalid login credentials') || message.includes('Incorrect email address or password')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (message.includes('Account not found')) {
    return 'Account not found. Please check your email or create an account.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }
  if (message.includes('User already registered') || message.includes('already exists')) {
    return 'This email address is already in use. Please sign in instead.';
  }
  if (message.toLowerCase().includes('weak_password') || message.toLowerCase().includes('should be at least')) {
    return 'Password is too weak. Make sure it is at least 6 characters.';
  }

  return message;
};
