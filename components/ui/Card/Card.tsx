import { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, description, footer, children }: Props) {
  return (
    <div className="w-full max-w-lg m-auto my-8 border rounded-[20px] dark:border-white/20 border-black/20">
      <div className="p-6">
        <div className='size-fit dark:bg-[#2B2B2B] bg-[#D4D4D4] dark:border-[#ffffff]/5 border-black/5 border rounded-full p-3'>
          <h3 className="text-xl font-bold dark:text-white text-black">{title}</h3>
        </div>
        <div className='mt-9'>
        <p className="dark:text-white text-black text-5xl font-extrabold">{description}</p>
        {children}
        </div>
      </div>
      {footer && (
        <div className="p-3.5 border-t dark:border-white/20 border-black/20 rounded-b-[20px] bg-[#F1F1F1] dark:bg-[#0E0E0E]">
          {footer}
        </div>
      )}
    </div>
  );
}