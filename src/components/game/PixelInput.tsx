import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {}

const PixelInput = forwardRef<HTMLInputElement, PixelInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full bg-muted px-3 py-2 font-game text-xl',
          'pixel-border pixel-inset',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

PixelInput.displayName = 'PixelInput';

export { PixelInput };
