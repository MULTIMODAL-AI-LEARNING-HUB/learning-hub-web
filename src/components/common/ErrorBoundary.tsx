import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React render cycle:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-surface-elevated p-6 shadow-2xl text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 text-destructive mb-2">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Đã xảy ra lỗi giao diện</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'Có lỗi không mong muốn xảy ra trong ứng dụng.'}
            </p>
            <div className="pt-4 flex justify-center">
              <Button variant="primary" onClick={this.handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Tải lại trang
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
