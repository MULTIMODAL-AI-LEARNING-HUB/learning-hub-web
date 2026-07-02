import { useState, useEffect } from 'react'
import { Settings, User, Lock, Bell, Check, AlertCircle } from 'lucide-react'
import { authApi } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/useToast'

export function LecturerSettings() {
  const toast = useToast()

  const [rawUser, setRawUser] = useState<{
    full_name: string | null
    email: string
    created_at: string | null
    quota?: { storageUsed: number; storageTotal: number; tokensUsed: number; tokensTotal: number }
  } | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    authApi.me().then(res => {
      setRawUser(res.data as typeof rawUser)
      setFullName(res.data.full_name ?? '')
      setEmail(res.data.email)
    }).catch(() => {})
  }, [])

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({ type: 'warning', title: 'Name is required' })
      return
    }
    setSaving(true)
    try {
      await authApi.updateMe({ full_name: fullName })
      const res = await authApi.me()
      setRawUser(res.data)
      toast({ type: 'success', title: 'Profile updated' })
    } catch {
      toast({ type: 'error', title: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!currentPassword) {
      setPasswordError('Current password is required')
      return
    }
    if (!newPassword) {
      setPasswordError('New password is required')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    setPasswordSaving(true)
    try {
      await authApi.resetPassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({ type: 'success', title: 'Password changed successfully' })
    } catch {
      setPasswordError('Failed to change password. Please check your current password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const quota = rawUser?.quota
  ? {
      storageUsed: rawUser.quota.storage_used_mb ?? 0,
      storageTotal: rawUser.quota.storage_limit_mb ?? 0,
      tokensUsed: rawUser.quota.token_used ?? 0,
      tokensTotal: rawUser.quota.token_limit ?? 0,
    }
  : null

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        description="Manage your account settings"
        icon={<Settings />}
      />

      <div className="grid lg:grid-cols-2 gap-6 max-w-3xl">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Profile Information</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Full Name</label>
              <Input value={fullName} onChange={setFullName} placeholder="Your full name" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email</label>
              <Input value={email} placeholder="your@email.com" type="email" disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Role</label>
              <div className="px-3 py-2 rounded-lg border border-input bg-muted/30 text-sm text-muted-foreground capitalize">
                lecturer
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Member Since</label>
              <div className="px-3 py-2 rounded-lg border border-input bg-muted/30 text-sm text-muted-foreground">
                {rawUser?.created_at
                  ? new Date(rawUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveProfile} loading={saving} icon={<Check className="h-4 w-4" />}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Change Password</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Current Password</label>
              <Input type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Enter current password" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">New Password</label>
              <Input type="password" value={newPassword} onChange={setNewPassword} placeholder="Enter new password" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Confirm New Password</label>
              <Input type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" />
            </div>
            {passwordError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {passwordError}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={handleChangePassword} loading={passwordSaving}>
                Change Password
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {quota && (
        <Card className="max-w-3xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Bell className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-foreground">Usage & Quota</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {quota.storageUsed.toFixed(1)} / {quota.storageTotal} MB
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min((quota.storageUsed / quota.storageTotal) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AI Tokens</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {quota.tokensUsed.toLocaleString()} / {quota.tokensTotal.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: `${Math.min((quota.tokensUsed / quota.tokensTotal) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}