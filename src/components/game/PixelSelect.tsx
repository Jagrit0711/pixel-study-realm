import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface PixelSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

const PixelSelect = forwardRef<HTMLSelectElement, PixelSelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full bg-muted px-3 py-2 font-game text-xl',
          'pixel-border pixel-inset appearance-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

PixelSelect.displayName = 'PixelSelect';

export { PixelSelect };
