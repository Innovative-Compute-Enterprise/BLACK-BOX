import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import BlackBox from '../../../../components/icons/BlackBox';
import ForgotPassword from '../../../../components/ui/auth-components/ForgotPassword';
import PasswordLogin from '../../../../components/ui/auth-components/PasswordLogin';
import Signup from '../../../../components/ui/auth-components/Signup';
import UpdatePassword from '../../../../components/ui/auth-components/UpdatePassword';


export default async function SignIn({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { disable_button: boolean };
}) {
  const { allowEmail} = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  // Declare 'viewProp' and initialize with the default value
  let viewProp: string;

  // Assign url id to 'viewProp' if it's a valid string and ViewTypes includes it
  if (typeof params.id === 'string' && viewTypes.includes(params.id)) {
    viewProp = params.id;
  } else {
    const preferredSignInView =
      cookies().get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
    return redirect(`/login/${viewProp}`);
  }

  // Check if the user is already logged in and redirect to the account page if so
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && viewProp !== 'update_password') {
    return redirect('/');
  } else if (!user && viewProp === 'update_password') {
    return redirect('/login');
  }

  return (
    <div className="flex justify-center">
      <div className="flex flex-col justify-between max-w-lg p-3 m-auto w-[380px] translate-y-1/4 ">
        <div className="flex justify-center my-1">
          <BlackBox />
        </div>
        <div
          title={
            viewProp === 'forgot_password'
              ? 'Reset Password'
                : viewProp === 'signup'
                  ? 'Sign Up'
                  : 'Sign In'
          }
        >
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
            <Signup allowEmail={allowEmail} redirectMethod={redirectMethod} />
          )}
          {viewProp !== 'update_password' &&
            viewProp !== 'signup' 
           }
        </div>
      </div>
    </div>
  );
}