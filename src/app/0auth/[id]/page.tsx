import { createClient } from '@/src/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/src/utils/auth-helpers/settings';
import BlackBox from '@/src/components/icons/BlackBox';
import ForgotPassword from '@/src/components/ui/auth-components/ForgotPassword';
import PasswordLogin from '@/src/components/ui/auth-components/PasswordLogin';
import Signup from '@/src/components/ui/auth-components/Signup';
import UpdatePassword from '@/src/components/ui/auth-components/UpdatePassword';
import Welcome from '@/src/components/ui/auth-components/Welcome'; // Ensure this path is correct

export default async function SignIn({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ disable_button: boolean }>;
}) {
  const { id } = await params;
  const { disable_button } = await searchParams;

  const cookieStore = await cookies();
  const preferredSignInView = cookieStore.get('preferredSignInView')?.value || null;
  let viewProp: string = getDefaultSignInView(preferredSignInView);

  const viewTypes = getViewTypes();
  // Allow 'welcome' as a valid view from the URL if needed, or handle default
  if (id && viewTypes.includes(id)) {
     viewProp = id;
  } else if (!id && !preferredSignInView) {
     // If no ID in URL and no preference cookie, maybe default to 'welcome'?
     viewProp = 'welcome'; // Or keep your existing default logic
  }


  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && viewProp !== 'update_password') {
    return redirect('/');
  }
  if (!user && viewProp === 'update_password') {
    return redirect('/0auth/welcome'); 
  }

  return (
    <section className="relative min-h-screen w-full"> {/* Added relative for icon positioning */}

      {/* Conditionally render the Welcome component WITHOUT the centering wrappers */}
      {viewProp === 'welcome' ? (
        <Welcome />
      ) : (
        <>
          <div className="flex flex-col justify-center items-center min-h-screen px-4"> {/* Added some padding */}
            <div className="flex flex-col justify-between w-full max-w-[364px] p-6 "> {/* Adjusted styling for auth forms */}
              {/* No title prop needed here */}
              <div>
                {viewProp === 'password_signin' && (
                  <PasswordLogin
                    allowEmail={getAuthTypes().allowEmail}
                    redirectMethod={getRedirectMethod()}
                  />
                )}
                {viewProp === 'forgot_password' && (
                  <ForgotPassword
                    redirectMethod={getRedirectMethod()}
                    disableButton={disable_button}
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
        </>
      )}
    </section>
  );
}