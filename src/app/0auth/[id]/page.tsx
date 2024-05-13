import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import BlackBox from '@/components/icons/BlackBox';
import ForgotPassword from '@/components/ui/auth-components/ForgotPassword';
import PasswordLogin from '@/components/ui/auth-components/PasswordLogin';
import Signup from '@/components/ui/auth-components/Signup';
import UpdatePassword from '@/components/ui/auth-components/UpdatePassword';
import Welcome from '@/components/ui/auth-components/Welcome'; // Make sure to import your LandingPage component

export default async function SignIn({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { disable_button: boolean };
}) {
  const { allowEmail } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  // Declare 'viewProp' and initialize with the default value
  let viewProp: string = getDefaultSignInView(null); // Default view when no ID provided

  // Assign url id to 'viewProp' if it's a valid string and ViewTypes includes it
  if (typeof params.id === 'string' && viewTypes.includes(params.id)) {
    viewProp = params.id;
  } else {
    const preferredSignInView =
      cookies().get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // If a user is logged in and trying to access any page other than 'update_password'
  if (user && viewProp !== 'update_password') {
    // Redirect to home page
      return redirect('/');
  }

  // If not a user and trying to access 'update_password', redirect to login
  if (!user && viewProp === 'update_password') {
    return redirect('/0auth');
  }

  return (
    <section>
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
        <BlackBox className='w-[52px] h-[52px]' />
      </div>
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="flex flex-col justify-between m-auto max-w-lg w-[320px]">
          <div title={viewProp === 'forgot_password' ? 'Reset Password' : viewProp === 'signup' ? 'Sign Up' : 'Sign In'}>
            {viewProp === 'welcome' && (
              <Welcome /> // Using the Welcome component
            )}
            {viewProp === 'password_signin' && (
              <PasswordLogin
                allowEmail={allowEmail}
                redirectMethod={redirectMethod}
              />
            )}
            {viewProp === 'forgot_password' && (
              <ForgotPassword
                redirectMethod={redirectMethod}
                disableButton={searchParams.disable_button}
              />
            )}
            {viewProp === 'update_password' && (
              <UpdatePassword redirectMethod={redirectMethod} />
            )}
            {viewProp === 'signup' && (
              <Signup redirectMethod={redirectMethod} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
