import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold',
          'transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] focus-visible:ring-indigo-500':
              variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-[0.98] focus-visible:ring-slate-500':
              variant === 'secondary',
            'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:scale-[0.98] focus-visible:ring-indigo-500':
              variant === 'outline',
            'text-slate-700 hover:bg-slate-100 active:scale-[0.98] focus-visible:ring-slate-500':
              variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 hover:shadow-md active:scale-[0.98] focus-visible:ring-red-500':
              variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
