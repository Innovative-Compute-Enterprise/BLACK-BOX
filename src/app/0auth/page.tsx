import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';

export default async function SignIn() {
  // Get the cookie store (no need to call the result as a function)
  const cookieStore = await cookies();
  const preferredSignInView = cookieStore.get('preferredSignInView')?.value || null;
  const defaultView = getDefaultSignInView(preferredSignInView);

  return redirect(`/0auth/${defaultView}`);
}
