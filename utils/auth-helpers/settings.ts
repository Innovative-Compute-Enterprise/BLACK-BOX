// Boolean toggles to determine which auth types are allowed
const allowOauth = true;
const allowEmail = true;
const allowPassword = true;

// Boolean toggle to determine whether auth interface should route through server or client
// (Currently set to false because screen sometimes flickers with server redirects)
const allowServerRedirect = false;

// Check that at least one of allowPassword and allowEmail is true
if (!allowPassword && !allowEmail)
  throw new Error('At least one of allowPassword and allowEmail must be true');

export const getAuthTypes = () => {
  return { allowOauth, allowEmail, allowPassword };
};

export const getViewTypes = () => {
  // Define the valid view types
  let viewTypes: string[] = ['welcome'];
  if (allowEmail) {
    viewTypes = [...viewTypes, 'email_signin'];
  }
  if (allowPassword) {
    viewTypes = [
      ...viewTypes,
      'password_signin',
      'forgot_password',
      'update_password',
      'signup'
    ];
  }

  return viewTypes;
};

export const getDefaultSignInView = (preferredSignInView: string | null) => {
  // Define the default sign in view
  let defaultView = 'welcome';
  if (preferredSignInView && getViewTypes().includes(preferredSignInView)) {
    defaultView = preferredSignInView;
  }

  return 'welcome' ;
};

export const getRedirectMethod = () => {
  return allowServerRedirect ? 'server' : 'client';
};