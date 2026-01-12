/**
 * ProfileCompletenessIndicator Component
 * Displays profile completion percentage with a visual progress bar
 * Supports i18n and RTL layouts
 */

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface ProfileCompletenessIndicatorProps {
  percentage: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact'
}

export function ProfileCompletenessIndicator({
  percentage,
  className,
  showLabel = true,
  size = 'md',
  variant = 'default'
}: ProfileCompletenessIndicatorProps) {
  const t = useTranslations('collaborate.userCard')

  // Ensure percentage is between 0 and 100
  const normalizedPercentage = Math.min(100, Math.max(0, percentage))

  // Color based on completion level
  const getColorClass = (pct: number) => {
    if (pct >= 90) return 'bg-green-500'
    if (pct >= 70) return 'bg-blue-500'
    if (pct >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  // Size variants
  const sizeClasses = {
    sm: 'h-1.5 text-xs',
    md: 'h-2 text-sm',
    lg: 'h-2.5 text-base'
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', sizeClasses[size])}>
          <div
            className={cn('h-full transition-all duration-300', getColorClass(normalizedPercentage))}
            style={{ width: `${normalizedPercentage}%` }}
          />
        </div>
        <span className={cn('font-medium text-muted-foreground whitespace-nowrap', sizeClasses[size])}>
          {normalizedPercentage}%
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn('font-medium text-muted-foreground', sizeClasses[size])}>
            {t('profileCompleteness', { percentage: normalizedPercentage })}
          </span>
        </div>
      )}
      <div className={cn('bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full transition-all duration-300', getColorClass(normalizedPercentage))}
          style={{ width: `${normalizedPercentage}%` }}
          role="progressbar"
          aria-valuenow={normalizedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('profileCompleteness', { percentage: normalizedPercentage })}
        />
      </div>
    </div>
  )
}
