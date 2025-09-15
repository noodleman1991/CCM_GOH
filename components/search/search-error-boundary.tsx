'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
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
      return (
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Service Error</h3>
            <p className="text-muted-foreground mb-4">
              There was an issue with the search service. This might be due to missing configuration.
            </p>
            <Button
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )
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
    <Card className="border-destructive">
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Search Service Error</h3>
        <p className="text-muted-foreground mb-2">
          {error.message || 'There was an issue with the search service.'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Please check that your Algolia configuration is correct.
        </p>
        <Button
          onClick={resetErrorBoundaryAction}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}
