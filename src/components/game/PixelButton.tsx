import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef, ReactNode } from 'react';

interface PixelButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, onClick, type = 'button' }, ref) => {
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:brightness-110',
      secondary: 'bg-secondary text-secondary-foreground hover:brightness-105',
      accent: 'bg-accent text-accent-foreground hover:brightness-110',
      danger: 'bg-destructive text-destructive-foreground hover:brightness-110',
      gold: 'bg-game-gold text-foreground hover:brightness-110',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-lg',
      md: 'px-5 py-2.5 text-xl',
      lg: 'px-7 py-3.5 text-2xl',
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={disabled ? undefined : { y: -2 }}
        whileTap={disabled ? undefined : { y: 1 }}
        className={cn(
          'font-game pixel-border relative transition-all duration-100',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100',
          'active:shadow-none active:translate-y-[2px]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </motion.button>
    );
  }
);

PixelButton.displayName = 'PixelButton';

export { PixelButton };
