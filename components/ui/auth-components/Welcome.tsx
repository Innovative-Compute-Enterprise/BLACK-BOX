import  Button  from "@/components/ui/Button";
import Link from 'next/link';

export default async function Welcome() {

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <h1 className="text-4xl font-bold">Welcome to Black Box</h1>
      <p className="text-lg">Brought to you with Next and Supabase.</p>
      <div className="w-[320px]">
          <Link href="/0auth/password_signin">
           <Button
            variant="flat"
            type="submit"
            className="my-4 w-full"
          >
            Entrar
          </Button>
          </Link>

          <Link href="/0auth/signup">
          <Button
            variant="flat"
            type="submit"
            className="my-4 w-full"
          >
            Criar conta
          </Button>
          </Link>
          </div>
    </div>
  );
}