'use server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getURL, getErrorRedirect, getStatusRedirect } from '@/utils/helpers';

function isValidEmail(email: string) {
  var regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}

export async function redirectToPath(path: string) {
  return redirect(path);
}

export async function SignOut(formData: FormData) {
  const pathName = String(formData.get('pathName')).trim();

  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return getErrorRedirect(
      pathName,
      'Hmm... Something went wrong.',
      'You could not be signed out.'
    );
  }

  return '/0auth';
}

export async function requestPasswordUpdate(formData: FormData) {
  const callbackURL = getURL('/auth/reset-password');

  // Get form data
  const email = String(formData.get('email')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/0auth/forgot_password',
      'Invalid email address.',
      'Please try again.'
    );
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackURL
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/0auth/forgot_password',
      error.message,
      'Please try again.'
    );
  } else if (data) {
    redirectPath = getStatusRedirect(
      '/0auth/forgot_password',
      'Success!',
      'Please check your email for a password reset link. You may now close this tab.',
      true
    );
  } else {
    redirectPath = getErrorRedirect(
      '/0auth/forgot_password',
      'Hmm... Something went wrong.',
      'Password reset email could not be sent.'
    );
  }

  return redirectPath;
}

export async function signInWithPassword(formData: FormData) {
  const cookieStore = await cookies();
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  let redirectPath: string;

  const supabase = createClient();
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/0auth/password_signin',
      'Sign in failed.',
      error.message
    );
  } else if (data.user) {
    // FIX: Now cookieStore is the actual cookie store object, so set() works
    cookieStore.set('preferredSignInView', 'password_signin', { path: '/' });
    redirectPath = getStatusRedirect('/', 'Success!', 'You are now signed in.');
  } else {
    redirectPath = getErrorRedirect(
      '/0auth/password_signin',
      'Hmm... Something went wrong.',
      'You could not be signed in.'
    );
  }

  return redirectPath;
}

async function isEmailInUse(email: string): Promise<boolean> {
  const supabase = createClient();
  try {
    const { data } = await supabase
      .from('users')
      .select('email') 
      .eq('email', email)
      .limit(1); 
    return data !== null && data.length > 0; 
  } catch (error) {
    console.error("Error in isEmailInUse (simplified query):", error);
    return false;
  }
}

export async function signUp(formData: FormData) {
  const callbackURL = getURL('/auth/callback');

  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();

  let redirectPath: string;

  // First, check if the email is valid
  if (!isValidEmail(email)) {
    return getErrorRedirect(
      '/0auth/signup',
      'Invalid email address.',
      'Please try again.'
    );
  }

  // Next, check if the email is already in use
  if (await isEmailInUse(email)) {
    return getErrorRedirect('/0auth/signup', 'Email already in use.', 'Please use a different email.');
  }

  const supabase = createClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackURL
    }
  });

  if (error) {
    let errorMessage = 'Sign up failed.';
    if (error.message.toLowerCase().includes('already in use')) {
      errorMessage = 'There is already an account associated with this email address.';
    }
    redirectPath = getErrorRedirect('/0auth/signup', errorMessage, error.message);
  } else if (data.session) {
    // User is immediately signed in
    redirectPath = getStatusRedirect('/', 'Success!', 'You are now signed in.');
  } else if (data.user) {
    // Email confirmation required, redirect to the auth page
    redirectPath = getStatusRedirect(
      '/0auth',
      'Success!',
      'Please check your email for a confirmation link. You may now confirm your email and auth.'
    );
  } else {
    // General error handling
    redirectPath = getErrorRedirect(
      '/0auth/signup',
      'Hmm... Something went wrong.',
      'You could not be signed up.'
    );
  }

  return redirectPath;
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password')).trim();
  const passwordConfirm = String(formData.get('passwordConfirm')).trim();
  let redirectPath: string;

  // Check that the password and confirmation match
  if (password !== passwordConfirm) {
    redirectPath = getErrorRedirect(
      '/0auth/update_password',
      'Your password could not be updated.',
      'Passwords do not match.'
    );
  }

  const supabase = createClient();
  const { error, data } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/0auth/update_password',
      'Your password could not be updated.',
      error.message
    );
  } else if (data.user) {
    redirectPath = getStatusRedirect(
      '/',
      'Success!',
      'Your password has been updated.'
    );
  } else {
    redirectPath = getErrorRedirect(
      '/0auth/update_password',
      'Hmm... Something went wrong.',
      'Your password could not be updated.'
    );
  }

  return redirectPath;
}

export async function updateEmail(formData: FormData) {
  const newEmail = String(formData.get('newEmail')).trim();

  if (!isValidEmail(newEmail)) {
    return getErrorRedirect(
      '/account',
      'Your email could not be updated.',
      'Invalid email address.'
    );
  }

  const supabase = createClient();

  const callbackUrl = getURL(
    getStatusRedirect('/account', 'Success!', `Your email has been updated.`)
  );

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    {
      emailRedirectTo: callbackUrl
    }
  );

  if (error) {
    return getErrorRedirect(
      '/account',
      'Your email could not be updated.',
      error.message
    );
  } else {
    return getStatusRedirect(
      '/account',
      'Confirmation emails sent.',
      `You will need to confirm the update by clicking the links sent to both the old and new email addresses.`
    );
  }
}

export async function updateName(formData: FormData): Promise<string> {
  const fullName = String(formData.get('fullName')).trim();
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Authentication failed');
  }

  const { error: updateUserError } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  if (updateUserError) {
    throw new Error('Failed to update user data');
  }

  const { error: updateTableError } = await supabase
    .from('users')
    .update({ full_name: fullName })
    .eq('id', userData.user.id);

  if (updateTableError) {
    throw new Error('Failed to update user in database');
  }

  return fullName;
}