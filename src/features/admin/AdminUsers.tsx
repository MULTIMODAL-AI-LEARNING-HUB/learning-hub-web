import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Shield } from 'lucide-react'
import { adminApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { Skeleton } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/useToast'

interface UserItem {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string | null
}

export function AdminUsers() {
  const toast = useToast()
  const [users, setUsers] = useState<UserItem[]>([])
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const pageSize = 10

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState('student')
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await adminApi.listUsers(p, pageSize)
      setUsers(res.data.items)
      setTotalUsers(res.data.total)
    } catch {
      toast({ type: 'error', title: 'Không thể tải danh sách người dùng' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers(page)
  }, [page, fetchUsers])

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize))

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return u.email.toLowerCase().includes(q) || (u.full_name && u.full_name.toLowerCase().includes(q))
  })

  const handleCreate = async () => {
    if (!newEmail || !newPassword) {
      toast({ type: 'warning', title: 'Vui lòng nhập đầy đủ email và mật khẩu' })
      return
    }
    setSaving(true)
    try {
      await adminApi.createUser({ email: newEmail, password: newPassword, full_name: newFullName || undefined, role: newRole })
      toast({ type: 'success', title: 'Tạo người dùng thành công' })
      setShowCreateModal(false)
      setNewEmail(''); setNewPassword(''); setNewFullName(''); setNewRole('student')
      fetchUsers(page)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Không thể tạo người dùng' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      await adminApi.updateUser(editingUser.id, {
        full_name: editFullName || undefined,
        role: editRole || undefined,
        is_active: editIsActive,
      })
      toast({ type: 'success', title: 'Cập nhật người dùng thành công' })
      setEditingUser(null)
      fetchUsers(page)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Không thể cập nhật người dùng' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    setSaving(true)
    try {
      await adminApi.deleteUser(deletingUser.id)
      toast({ type: 'success', title: 'Xóa người dùng thành công' })
      setDeletingUser(null)
      fetchUsers(page)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Không thể xóa người dùng' })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (user: UserItem) => {
    setEditingUser(user)
    setEditFullName(user.full_name ?? '')
    setEditRole(user.role)
    setEditIsActive(user.is_active)
  }

  return (
    <div className="space-y-6 p-6 font-body">
      <div className="flex flex-col gap-1">
        <h1 className="text-fluid-2xl font-bold text-foreground">Quản lý người dùng</h1>
        <p className="text-muted-foreground text-sm">Tạo mới, chỉnh sửa và phân quyền tài khoản người dùng trên toàn hệ thống.</p>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={setSearchQuery}
            prefixIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
          Tạo người dùng
        </Button>
      </div>

      {/* Users table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-5">Người dùng</th>
                <th className="py-2.5 px-5">Vai trò</th>
                <th className="py-2.5 px-5">Trạng thái</th>
                <th className="py-2.5 px-5">Ngày đăng ký</th>
                <th className="py-2.5 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-5"><div className="flex items-center gap-2.5"><Skeleton variant="circular" width={32} height={32} /><div className="space-y-1"><Skeleton width={120} height={12} /><Skeleton width={160} height={10} /></div></div></td>
                    <td className="py-3 px-5"><Skeleton width={60} height={20} /></td>
                    <td className="py-3 px-5"><Skeleton width={60} height={20} /></td>
                    <td className="py-3 px-5"><Skeleton width={80} height={12} /></td>
                    <td className="py-3 px-5"><Skeleton width={60} height={20} /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Không tìm thấy người dùng nào</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar fallback={(u.full_name || u.email).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{u.full_name || 'Chưa cung cấp tên'}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <Badge
                        variant={u.role === 'admin' ? 'primary' : u.role === 'lecturer' ? 'info' : 'default'}
                        label={u.role === 'admin' ? 'Quản trị viên' : u.role === 'lecturer' ? 'Giảng viên' : 'Học viên'}
                      />
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${u.is_active ? 'bg-success animate-pulse-soft' : 'bg-muted-foreground'}`} />
                        <span className={`text-xs font-medium ${u.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                          {u.is_active ? 'Đang hoạt động' : 'Ngừng kích hoạt'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-xs text-muted-foreground tabular-nums">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Chỉnh sửa">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeletingUser(u)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition" title="Xóa">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">Trang <span className="font-semibold text-foreground">{page}</span> trên <span className="font-semibold text-foreground">{totalPages}</span></p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<ChevronLeft className="h-3.5 w-3.5" />} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Trước</Button>
            <Button variant="outline" size="sm" iconRight={<ChevronRight className="h-3.5 w-3.5" />} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>Sau</Button>
          </div>
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tạo người dùng mới" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Địa chỉ Email *</label>
            <Input value={newEmail} onChange={setNewEmail} placeholder="ban@example.com" type="email" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Mật khẩu *</label>
            <Input value={newPassword} onChange={setNewPassword} placeholder="Tối thiểu 6 ký tự" type="password" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Họ và tên</label>
            <Input value={newFullName} onChange={setNewFullName} placeholder="Không bắt buộc" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Vai trò</label>
            <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="student">Học viên</option>
              <option value="lecturer">Giảng viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>Hủy</Button>
          <Button onClick={handleCreate} loading={saving} icon={<Plus className="h-4 w-4" />}>Tạo người dùng</Button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Chỉnh sửa người dùng" size="md">
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Địa chỉ Email</label>
              <div className="px-3 py-2 rounded-lg border border-input bg-muted/30 text-sm text-muted-foreground">{editingUser.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Họ và tên</label>
              <Input value={editFullName} onChange={setEditFullName} placeholder="Nhập họ và tên" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Vai trò</label>
              <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                <option value="student">Học viên</option>
                <option value="lecturer">Giảng viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} className="h-4 w-4 rounded border-input" />
              <label htmlFor="isActive" className="text-sm font-medium text-foreground">Kích hoạt (cho phép đăng nhập)</label>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setEditingUser(null)}>Hủy</Button>
          <Button onClick={handleUpdate} loading={saving} icon={<Shield className="h-4 w-4" />}>Lưu thay đổi</Button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deletingUser} onClose={() => setDeletingUser(null)} title="Xác nhận xóa người dùng" size="sm">
        {deletingUser && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold text-foreground">{deletingUser.full_name || deletingUser.email}</span>? Thao tác này không thể hoàn tác.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setDeletingUser(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving} icon={<Trash2 className="h-4 w-4" />}>Xóa người dùng</Button>
        </div>
      </Modal>
    </div>
  )
}