import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Layers, RefreshCw } from 'lucide-react'
import { categoriesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/useToast'

interface CategoryTree {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
  parent_id: string | null
  created_at: string | null
  children?: CategoryTree[]
}

interface CategoryItem {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
}

export function AdminCategories() {
  const toast = useToast()
  const [tree, setTree] = useState<CategoryTree[]>([])
  const [loading, setLoading] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const fetchTree = useCallback(async () => {
    setLoading(true)
    try {
      const res = await categoriesApi.getTree()
      setTree(res.data as unknown as CategoryTree[])
    } catch {
      toast({ type: 'error', title: 'Failed to load categories' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTree()
  }, [fetchTree])

  const allCategories = flattenTreeItems(tree)

  const generateSlug = (n: string) =>
    n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ type: 'warning', title: 'Category name is required' })
      return
    }
    const autoSlug = slug || generateSlug(name)
    setSaving(true)
    try {
      await categoriesApi.create({
        name: name.trim(),
        slug: autoSlug,
        description: description.trim() || undefined,
        parent_id: parentId || undefined,
      })
      toast({ type: 'success', title: 'Category created' })
      setShowCreateModal(false)
      setName(''); setSlug(''); setDescription(''); setParentId('')
      fetchTree()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Failed to create category' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCategory) return
    setSaving(true)
    try {
      await categoriesApi.update(editingCategory.id, {
        name: editName || undefined,
        description: editDescription || undefined,
      })
      toast({ type: 'success', title: 'Category updated' })
      setEditingCategory(null)
      fetchTree()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Failed to update category' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setSaving(true)
    try {
      await categoriesApi.delete(deletingCategory.id)
      toast({ type: 'success', title: 'Category deleted' })
      setDeletingCategory(null)
      fetchTree()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      toast({ type: 'error', title: err?.response?.data?.detail || 'Failed to delete category' })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (cat: CategoryTree) => {
    setEditingCategory(cat)
    setEditName(cat.name)
    setEditDescription(cat.description ?? '')
  }

  const openCreateChild = (parentId: string) => {
    setParentId(parentId)
    setName('')
    setSlug('')
    setDescription('')
    setShowCreateModal(true)
  }

  const resetCreate = () => {
    setName(''); setSlug(''); setDescription(''); setParentId('')
    setShowCreateModal(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-fluid-2xl font-bold text-foreground">Category Management</h1>
        <p className="text-muted-foreground text-sm">Organize platform categories with a tree structure.</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={fetchTree} loading={loading}>Refresh</Button>
        <Button icon={<Plus className="h-4 w-4" />} onClick={resetCreate}>New Category</Button>
      </div>

      <Card>
        <div className="p-4">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <Layers className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No categories yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map(cat => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  level={0}
                  onEdit={openEdit}
                  onDelete={setDeletingCategory}
                  onAddChild={openCreateChild}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Category" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Name *</label>
            <Input value={name} onChange={setName} placeholder="e.g. Web Development" onBlur={() => !slug && setSlug(generateSlug(name))} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Slug</label>
            <Input value={slug} onChange={setSlug} placeholder="auto-generated" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Parent Category</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={parentId}
              onChange={e => setParentId(e.target.value)}
            >
              <option value="">— None (Top-level) —</option>
              {allCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving} icon={<Plus className="h-4 w-4" />}>Create</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingCategory} onClose={() => setEditingCategory(null)} title="Edit Category" size="md">
        {editingCategory && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Name *</label>
              <Input value={editName} onChange={setEditName} placeholder="Category name" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Slug</label>
              <div className="px-3 py-2 rounded-lg border border-input bg-muted/30 text-sm text-muted-foreground">{editingCategory.slug}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={2}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
          <Button onClick={handleUpdate} loading={saving} icon={<Pencil className="h-4 w-4" />}>Save</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deletingCategory} onClose={() => setDeletingCategory(null)} title="Delete Category" size="sm">
        {deletingCategory && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">"{deletingCategory.name}"</span>? All child categories will also be deleted.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setDeletingCategory(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={saving} icon={<Trash2 className="h-4 w-4" />}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

function CategoryRow({ category, level, onEdit, onDelete, onAddChild }: {
  category: CategoryTree
  level: number
  onEdit: (c: CategoryTree) => void
  onDelete: (c: CategoryItem) => void
  onAddChild: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = category.children && category.children.length > 0

  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 transition group">
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 hover:bg-muted rounded">
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {category.icon && <span className="text-base">{category.icon}</span>}
          <span className="text-sm font-medium text-foreground truncate">{category.name}</span>
          <Badge variant="default" label={`${category.slug}`} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onAddChild(category.id)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
            title="Add child"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="ml-5 border-l border-border pl-2">
          {category.children!.map(child => (
            <CategoryRow
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function flattenTreeItems(categories: CategoryTree[]): CategoryItem[] {
  return categories.flatMap(cat => [
    { id: cat.id, name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, parent_id: cat.parent_id },
    ...(cat.children ? flattenTreeItems(cat.children) : []),
  ])
}