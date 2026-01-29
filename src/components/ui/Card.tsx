import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white rounded-xl border border-slate-200 shadow-soft p-6', className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-4', className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold text-slate-900', className)}
      {...props}
    />
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600 mt-1', className)}
      {...props}
    />
  );
});

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
