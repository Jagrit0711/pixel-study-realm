import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface PixelPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hud' | 'dialog' | 'wood';
}

const PixelPanel = forwardRef<HTMLDivElement, PixelPanelProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-card pixel-border',
      hud: 'bg-card/95 backdrop-blur-sm pixel-border',
      dialog: 'bg-card pixel-border-lg',
      wood: 'bg-game-wood pixel-border text-primary-foreground',
    };

    return (
      <div
        ref={ref}
        className={cn('p-4', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PixelPanel.displayName = 'PixelPanel';

export { PixelPanel };
