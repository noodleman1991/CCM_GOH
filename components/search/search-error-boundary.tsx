'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

function SearchErrorCard({
  message,
  showConfigHint = false,
  onRetry,
}: {
  message?: string
  showConfigHint?: boolean
  onRetry: () => void
}) {
  const t = useTranslations('search.error')

  return (
    <Card className="border-destructive">
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('title')}</h3>
        <p className={showConfigHint ? 'text-muted-foreground mb-2' : 'text-muted-foreground mb-4'}>
          {message || (showConfigHint ? t('genericMessage') : t('description'))}
        </p>
        {showConfigHint && (
          <p className="text-sm text-muted-foreground mb-4">
            {t('checkConfig')}
          </p>
        )}
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t('tryAgain')}
        </Button>
      </CardContent>
    </Card>
  )
}

export class SearchErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Search error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <SearchErrorCard onRetry={() => this.setState({ hasError: false })} />
    }

    return this.props.children
  }
}

// Alternative functional component version using react-error-boundary
export function SearchErrorFallback({
  error,
  resetErrorBoundaryAction
}: {
  error: Error
  resetErrorBoundaryAction: () => void
}) {
  return (
    <SearchErrorCard
      message={error.message}
      showConfigHint
      onRetry={resetErrorBoundaryAction}
    />
  )
}
