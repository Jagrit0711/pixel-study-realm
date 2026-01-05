import { cn } from '@/lib/utils';

interface PixelAvatarProps {
  seed: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Generate a simple pixel avatar based on seed
const generateAvatarColors = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  const saturation = 50 + (Math.abs(hash >> 8) % 30);
  const lightness = 45 + (Math.abs(hash >> 16) % 20);
  
  return {
    primary: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    secondary: `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness + 15}%)`,
    accent: `hsl(${(hue + 180) % 360}, ${saturation - 20}%, ${lightness + 20}%)`,
  };
};

export const PixelAvatar = ({ seed, size = 'md', className }: PixelAvatarProps) => {
  const colors = generateAvatarColors(seed);
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  // Create a simple 5x5 pixel pattern
  const pattern = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      const bit = (hash >> (y * 3 + x)) & 1;
      pattern.push(bit);
    }
  }

  return (
    <div
      className={cn(
        'relative pixel-border overflow-hidden bg-muted',
        sizes[size],
        className
      )}
      style={{ backgroundColor: colors.secondary }}
    >
      <svg viewBox="0 0 5 5" className="w-full h-full">
        {/* Background */}
        <rect width="5" height="5" fill={colors.secondary} />
        
        {/* Pattern (mirrored) */}
        {pattern.map((bit, i) => {
          if (!bit) return null;
          const x = i % 3;
          const y = Math.floor(i / 3);
          return (
            <g key={i}>
              <rect x={x} y={y} width="1" height="1" fill={colors.primary} />
              <rect x={4 - x} y={y} width="1" height="1" fill={colors.primary} />
            </g>
          );
        })}
        
        {/* Eyes */}
        <rect x="1" y="1" width="1" height="1" fill={colors.accent} />
        <rect x="3" y="1" width="1" height="1" fill={colors.accent} />
      </svg>
    </div>
  );
};
