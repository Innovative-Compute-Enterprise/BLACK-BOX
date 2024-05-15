import { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, description, footer, children }: Props) {
  return (
    <div className="w-full max-w-lg m-auto my-8 border rounded-[15px] border-white/20">
      <div className="p-6">
        <h3 className="mb-4 text-2xl font-bold">{title}</h3>
        <div className='my-3'>
        <p className="text-zinc-300 text-xl">{description}</p>
        {children}
        </div>
      </div>
      {footer && (
        <div className="p-3.5 border-t border-white/20 rounded-b-[15px] bg-[#0E0E0E]">
          {footer}
        </div>
      )}
    </div>
  );
}