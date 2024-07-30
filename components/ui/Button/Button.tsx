'use client';

import cn from 'classnames';
import React, { forwardRef, useRef, ButtonHTMLAttributes } from 'react';
import { mergeRefs } from 'react-merge-refs';

import LoadingDots from '../Loading-dots';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'slim' | 'flat';
  active?: boolean;
  width?: number;
  loading?: boolean;
  Component?: React.ComponentType;
}

const Button = forwardRef<HTMLButtonElement, Props>((props, buttonRef) => {
  const {
    className,
    variant = 'flat',
    children,
    active,
    width,
    loading = false,
    disabled = false,
    style = {},
    Component = 'button',
    ...rest
  } = props;
  const ref = useRef(null);
  const rootClassName = cn(
    'cursor-pointer shrink-0 rounded-lg font-bold py-3 transition-colors duration-300',
    'border border-[#27272a] bg-black text-white',
    'dark:border-[#E4E4E7] dark:bg-white dark:text-black',
    {
      'hover:text-white hover:bg-[#27272A] dark:hover:text-black dark:hover:bg-[#e2e2e2]': !loading && !disabled,
      'outline-none ring-2 ring-white ring-opacity-50': rest.onFocus,
      'bg-zinc-600': active,
      'bg-zinc-700 text-zinc-500 border-zinc-600 cursor-not-allowed': loading,
      'text-zinc-400 border-zinc-600 bg-zinc-700 cursor-not-allowed filter grayscale(1)':
        disabled,
    },
    className
  );

  return (
    <Component
      aria-pressed={active}
      data-variant={variant}
      ref={mergeRefs([ref, buttonRef])}
      className={rootClassName}
      disabled={disabled}
      style={{
        width,
        ...style,
      }}
      {...rest}
    >
      {children}
      {loading && (
        <i className="flex pl-2 m-0">
          <LoadingDots />
        </i>
      )}
    </Component>
  );
});
Button.displayName = 'Button';

export default Button;