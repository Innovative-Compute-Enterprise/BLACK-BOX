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
import Welcome from '@/components/ui/auth-components/Welcome';

export default async function SignIn({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { disable_button: boolean };
}) {
  // Remove "await" since params is now a plain object
  const { id } = params;

  const cookieStore = await cookies();
  const preferredSignInView =
    cookieStore.get('preferredSignInView')?.value || null;
  let viewProp: string = getDefaultSignInView(preferredSignInView);

  const viewTypes = getViewTypes();
  if (typeof id === 'string' && viewTypes.includes(id)) {
    viewProp = id;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && viewProp !== 'update_password') {
    return redirect('/');
  }
  if (!user && viewProp === 'update_password') {
    return redirect('/0auth');
  }

  return (
    <section>
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
        <BlackBox className="w-[48px] h-[48px]" />
      </div>
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="flex flex-col justify-between m-auto max-w-lg w-[320px]">
          <div
            title={
              viewProp === 'forgot_password'
                ? 'Reset Password'
                : viewProp === 'signup'
                ? 'Sign Up'
                : 'Sign In'
            }
          >
            {viewProp === 'welcome' && <Welcome />}
            {viewProp === 'password_signin' && (
              <PasswordLogin
                allowEmail={getAuthTypes().allowEmail}
                redirectMethod={getRedirectMethod()}
              />
            )}
            {viewProp === 'forgot_password' && (
              <ForgotPassword
                redirectMethod={getRedirectMethod()}
                disableButton={searchParams.disable_button}
              />
            )}
            {viewProp === 'update_password' && (
              <UpdatePassword redirectMethod={getRedirectMethod()} />
            )}
            {viewProp === 'signup' && (
              <Signup redirectMethod={getRedirectMethod()} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}