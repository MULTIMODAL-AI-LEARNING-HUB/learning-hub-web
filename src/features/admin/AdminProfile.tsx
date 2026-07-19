import { useState, useEffect } from 'react'
import { Mail, ShieldCheck, CalendarDays, Award, User } from 'lucide-react'
import { authApi } from '../../services/api'
import { useAppStore } from '../../stores/appStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { Skeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/useToast'

export function AdminProfile() {
  const toast = useToast()
  const user = useAppStore((s) => s.auth.user)
  const loadUser = useAppStore((s) => s.auth.loadUser)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(user.name || '')
      setLoading(false)
    } else {
      loadUser().then(() => {
        setLoading(false)
      }).catch(() => {
        toast({ type: 'error', title: 'Failed to load user profile' })
        setLoading(false)
      })
    }
  }, [user, loadUser, toast])

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({ type: 'warning', title: 'Full name is required' })
      return
    }

    setSaving(true)
    try {
      await authApi.updateMe({ full_name: fullName.trim() })
      toast({ type: 'success', title: 'Profile updated successfully' })
      await loadUser()
    } catch {
      toast({ type: 'error', title: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    )
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  return (
    <div className="space-y-6 p-6 animate-fade-in font-body">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-elevated p-6 shadow-soft">
        <PageHeader
          title="Admin Profile"
          description="Manage your system administrator account information."
          icon={<User className="text-indigo-600 dark:text-indigo-400" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Main profile edit card */}
        <Card className="border-border shadow-soft bg-surface-elevated p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <Avatar fallback={initials} size="lg" className="ring-4 ring-indigo-500/10" />
            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.name || 'Administrator'}</h2>
              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                {user?.role} Mode
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Full Name</label>
              <Input
                value={fullName}
                onChange={(v) => setFullName(v)}
                placeholder="Enter your full name"
                className="max-w-md"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Email Address</label>
              <div className="flex items-center gap-2 max-w-md rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground select-none">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <span>{user?.email}</span>
              </div>
              <p className="text-2xs text-muted-foreground mt-0.5">Contact support to change your email address.</p>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} loading={saving} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Info card */}
        <div className="space-y-6">
          <Card className="border-border shadow-soft bg-surface-elevated p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <h3 className="font-semibold text-foreground">Account Status</h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xs text-muted-foreground">Member since</p>
                  <p className="text-xs font-semibold text-foreground tabular-nums">{formatDate(user?.createdAt || null)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                <Award className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xs text-muted-foreground">Access Role</p>
                  <p className="text-xs font-semibold text-foreground capitalize">{user?.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                <ShieldCheck className="h-4 w-4 text-success" />
                <div>
                  <p className="text-2xs text-muted-foreground">System Status</p>
                  <p className="text-xs font-semibold text-success">Active & Verified</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
