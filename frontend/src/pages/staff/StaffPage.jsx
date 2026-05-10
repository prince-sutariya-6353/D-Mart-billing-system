import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCog,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { formatDate } from '../../utils/formatCurrency'

const roles = ['admin', 'cashier', 'staff']
const roleBadge = {
  admin: 'badge-purple',
  cashier: 'badge-info',
  staff: 'badge-warning',
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'cashier',
  phone: '',
}

function TeamStat({ label, value, note }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{note}</p>
    </div>
  )
}

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const data = await authService.getAllStaff()
      setStaff(data)
    } catch {
      toast.error('Failed to load staff members.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (member) => {
    setEditTarget(member)
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      phone: member.phone || '',
    })
    setShowModal(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!form.name || !form.email) {
      toast.error('Name and email are required.')
      return
    }

    if (!editTarget && !form.password) {
      toast.error('Password is required for a new team member.')
      return
    }

    setSaving(true)

    try {
      if (editTarget) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await authService.updateUser(editTarget._id, payload)
        toast.success('Staff member updated.')
      } else {
        await authService.register(form)
        toast.success('Staff member added.')
      }

      setShowModal(false)
      setForm(emptyForm)
      setEditTarget(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save staff member.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return

    try {
      await authService.deleteUser(id)
      toast.success('Staff member deleted.')
      load()
    } catch {
      toast.error('Delete failed.')
    }
  }

  const handleToggle = async (member) => {
    try {
      await authService.updateUser(member._id, { isActive: !member.isActive })
      toast.success(`${member.name} ${member.isActive ? 'deactivated' : 'activated'}.`)
      load()
    } catch {
      toast.error('Status update failed.')
    }
  }

  const activeCount = useMemo(() => staff.filter((member) => member.isActive).length, [staff])
  const adminCount = useMemo(() => staff.filter((member) => member.role === 'admin').length, [staff])

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Team control</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-white">Manage the people who keep the store moving.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Update access, review login activity, and keep account status in sync with the team on the floor.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <TeamStat label="Team members" value={staff.length} note="All staff accounts" />
            <TeamStat label="Active now" value={activeCount} note="Accounts currently enabled" />
            <TeamStat label="Admins" value={adminCount} note="Users with full access" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="panel-title">Store team</h3>
          <p className="page-subtitle">Edit roles, disable access, or add a new team member.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} />
            Add team member
          </button>
        </div>
      </section>

      {loading ? (
        <div className="card flex min-h-[260px] items-center justify-center">
          <Loader2 size={30} className="animate-spin text-emerald-200" />
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {staff.map((member) => (
            <div
              key={member._id}
              className={`card transition hover:-translate-y-0.5 hover:border-emerald-300/20 ${
                member.isActive ? '' : 'opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-lg font-semibold text-emerald-100 ring-1 ring-white/10">
                    {member.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{member.name}</p>
                    <span className={roleBadge[member.role] || 'badge-info'}>
                      <Shield size={12} />
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button type="button" onClick={() => openEdit(member)} className="btn-ghost px-2 py-1.5">
                    <Edit2 size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(member._id)} className="btn-ghost px-2 py-1.5 text-rose-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-2 rounded-[24px] border border-white/8 bg-slate-950/35 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Email</span>
                  <span className="truncate text-right text-slate-200">{member.email}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Phone</span>
                  <span className="truncate text-right text-slate-200">{member.phone || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Last login</span>
                  <span className="text-right text-slate-200">{member.lastLogin ? formatDate(member.lastLogin) : 'Never'}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{member.isActive ? 'Active account' : 'Inactive account'}</p>
                  <p className="text-xs text-slate-500">Toggle access for this user.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(member)}
                  className={member.isActive ? 'badge-success' : 'badge-danger'}
                >
                  {member.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-lg">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                  {editTarget ? 'Update account' : 'Create account'}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white">
                  {editTarget ? 'Edit team member' : 'Add new team member'}
                </h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-5">
              <div>
                <label className="label">Full name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="staff@dmart.com"
                  value={form.email}
                  onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                />
              </div>

              <div>
                <label className="label">{editTarget ? 'New password' : 'Password'}</label>
                <input
                  type="password"
                  className="input"
                  placeholder={editTarget ? 'Leave blank to keep current password' : 'Enter a password'}
                  value={form.password}
                  onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Role</label>
                  <select
                    className="select"
                    value={form.role}
                    onChange={(event) => setForm((previous) => ({ ...previous, role: event.target.value }))}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91-XXXXXXXXXX"
                    value={form.phone}
                    onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <UserCog size={16} />}
                  {editTarget ? 'Save changes' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
