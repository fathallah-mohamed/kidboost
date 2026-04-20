import { cn } from '@/lib/utils';
import kidboostLogo from '@/assets/kidboost-logo.png';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  withText?: boolean;
  className?: string;
  /** Wrap the logo in a white rounded "badge" so it renders cleanly on any background */
  badge?: boolean;
  priority?: boolean;
}

const sizeMap: Record<LogoSize, { img: string; text: string; padding: string; gap: string }> = {
  sm: { img: 'h-8 w-auto', text: 'text-base', padding: 'p-1.5', gap: 'gap-2' },
  md: { img: 'h-12 w-auto', text: 'text-xl', padding: 'p-2', gap: 'gap-2.5' },
  lg: { img: 'h-20 w-auto', text: 'text-3xl', padding: 'p-3', gap: 'gap-3' },
};

/**
 * Kidboost logo, harmonised across the app.
 * Uses a white rounded badge by default to guarantee good contrast on any background.
 */
export const Logo = ({
  size = 'md',
  withText = false,
  className,
  badge = true,
  priority = false,
}: LogoProps) => {
  const s = sizeMap[size];

  const image = (
    <img
      src={kidboostLogo}
      alt="Kidboost - Planificateur de repas pour enfants"
      className={cn(s.img, 'object-contain')}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );

  return (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      {badge ? (
        <span
          className={cn(
            'inline-flex items-center justify-center bg-white rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform duration-200 hover:scale-105',
            s.padding,
          )}
        >
          {image}
        </span>
      ) : (
        image
      )}
      {withText && (
        <span className={cn('font-extrabold tracking-tight text-primary', s.text)}>
          Kidboost
        </span>
      )}
    </span>
  );
};

export default Logo;
