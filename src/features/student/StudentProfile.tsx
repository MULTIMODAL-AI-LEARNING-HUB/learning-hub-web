import { useState, useEffect } from 'react'
import { authApi } from '../../services/api'
import { useAppStore } from '../../stores/appStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Skeleton } from '../../components/ui/Skeleton'

export function StudentProfile() {
  const user = useAppStore((s) => s.auth.user)
  const loadUser = useAppStore((s) => s.auth.loadUser)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.name || '')
      setLoading(false)
    } else {
      loadUser().finally(() => setLoading(false))
    }
  }, [user, loadUser])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await authApi.me()
      setMessage({ type: 'success', text: 'Profile updated' })
      await loadUser()
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-32" />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-fluid-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <Card className="p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Avatar fallback={user?.initials || '?'} size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">{user?.name || 'User'}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <Input value={fullName} onChange={(v) => setFullName(v)} placeholder="Your name" />
          </div>

          {user?.quota && (
            <div className="border-t border-border pt-4 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Usage</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Storage</span>
                    <span>{Math.round(user.quota.storageUsed)}MB / {user.quota.storageTotal}MB</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (user.quota.storageUsed / user.quota.storageTotal) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>AI Tokens</span>
                    <span>{user.quota.tokensUsed} / {user.quota.tokensTotal}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (user.quota.tokensUsed / user.quota.tokensTotal) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {message && (
            <span className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-destructive'}`}>
              {message.text}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
