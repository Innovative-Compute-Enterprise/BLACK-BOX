'use server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { stripe } from '@/utils/stripe/config';
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
  const cookieStore = cookies();
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
  const { data } = await supabase
    .from('users')  
    .select('email')
    .eq('email', email)
    .single();
  return data !== null;  
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

  // Check for specific error related to email already in use
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

export async function prepareAccountDeletion(userId: string, stripeCustomerId: string, shouldSoftDelete = false) {
  
  const supabase = createClient();
  try {
    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    // If active subscriptions exist, do not allow deletion, suggest cancellation first
    if (subscriptions.data.length > 0) {
      return {
        status: 'pending',
        message: 'Active subscriptions detected. Please cancel all subscriptions before deleting the account.',
      };
    }

    // Perform deletion based on shouldSoftDelete parameter
    const deletionResponse = shouldSoftDelete ?
      await supabase.from('auth.users').update({ deleted_at: new Date().toISOString(), enabled: false }).eq('id', userId) :
      await supabase.auth.admin.deleteUser(userId);

    if (deletionResponse.error) {
      throw new Error('Failed to delete user account: ' + deletionResponse.error.message);
    }

    return {
      status: 'success',
      message: 'Your account has been ' + (shouldSoftDelete ? 'soft-deleted. You can restore your account within 30 days.' : 'permanently deleted.'),
    };
  } catch (error: unknown) { // Properly handle unknown type
    if (error instanceof Error) {
      console.error(`Error during account deletion preparation: ${error.message}`);
      return {
        status: 'error',
        message: `An error occurred during account deletion preparation: ${error.message}`
      };
    } else {
      console.error('Error during account deletion preparation: An unknown error occurred.');
      return {
        status: 'error',
        message: 'An unknown error occurred during account deletion preparation.'
      };
    }
  }  
}