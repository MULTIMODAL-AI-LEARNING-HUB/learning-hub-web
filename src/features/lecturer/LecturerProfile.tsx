import { useState, useEffect } from 'react'
import { User, Award, BookOpen, Users, Star, Edit2, Check, X } from 'lucide-react'
import { authApi } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/useToast'

export function LecturerProfile() {
  const toast = useToast()
  const [rawUser, setRawUser] = useState<{
    full_name: string | null
    email: string
    created_at: string | null
  } | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authApi.me().then(res => {
      setRawUser(res.data)
      setFullName(res.data.full_name ?? '')
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
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
      setEditing(false)
    } catch {
      toast({ type: 'error', title: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Profile"
        description="Manage your public lecturer profile"
        icon={<User />}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Profile Details</h3>
              </div>
              {!editing ? (
                <Button variant="ghost" size="sm" icon={<Edit2 className="h-3 w-3" />} onClick={() => setEditing(true)}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" icon={<X className="h-3 w-3" />} onClick={() => { setEditing(false); setFullName(rawUser?.full_name ?? '') }}>
                    Cancel
                  </Button>
                  <Button size="sm" icon={<Check className="h-3 w-3" />} onClick={handleSave} loading={saving}>
                    Save
                  </Button>
                </div>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                  {fullName?.charAt(0)?.toUpperCase() ?? 'L'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{rawUser?.full_name ?? 'Lecturer'}</h2>
                  <p className="text-sm text-muted-foreground">{rawUser?.email}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize mt-1 inline-block">
                    lecturer
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{rawUser?.full_name ?? 'Not set'}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-foreground">Account Information</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Member Since</span>
                <span className="text-foreground">
                  {rawUser?.created_at
                    ? new Date(rawUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account Status</span>
                <span className="text-success">Active</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Award className="h-4 w-4 text-warning" />
              <h3 className="font-semibold text-foreground">Teaching Stats</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">—</p>
                  <p className="text-xs text-muted-foreground">Courses Created</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">—</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">—</p>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}