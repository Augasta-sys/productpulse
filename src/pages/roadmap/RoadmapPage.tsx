import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  CalendarDays,
  Check,
  CircleAlert,
  LoaderCircle,
  Map,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type RoadmapStatus = 'planned' | 'in-progress' | 'completed';
type RoadmapPriority = 'low' | 'medium' | 'high';

interface RoadmapItem {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  priority: RoadmapPriority;
  targetDate: string;
  feedbackIds: string[];
}

const emptyForm = {
  title: '',
  description: '',
  status: 'planned' as RoadmapStatus,
  priority: 'medium' as RoadmapPriority,
  targetDate: '',
};

const statusOptions: { value: RoadmapStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const statusStyles: Record<RoadmapStatus, string> = {
  planned: 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  'in-progress': 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
};

const priorityStyles: Record<RoadmapPriority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  medium: 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
};

export default function RoadmapPage() {
  const { user } = useAuth();
  const workspaceId = String(user?.workspaceId || 'workspace-1');
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get<RoadmapItem[]>(`${API_URL}/roadmapItems`);
      setItems(response.data.filter((item) => String(item.workspaceId) === workspaceId));
    } catch {
      setError('Unable to load roadmap items. Check that JSON Server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [items, query, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setModalOpen(true);
  }

  function openEdit(item: RoadmapItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || '',
      status: item.status,
      priority: item.priority,
      targetDate: item.targetDate || '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Please enter a roadmap item title.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { ...form, title, workspaceId, feedbackIds: [] };
    try {
      if (editingId) {
        const response = await axios.patch<RoadmapItem>(`${API_URL}/roadmapItems/${editingId}`, payload);
        setItems((current) => current.map((item) => item.id === editingId ? response.data : item));
      } else {
        const response = await axios.post<RoadmapItem>(`${API_URL}/roadmapItems`, {
          ...payload,
          id: `roadmap-${Date.now()}`,
        });
        setItems((current) => [response.data, ...current]);
      }
      setModalOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
    } catch {
      setError('Could not save the roadmap item. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: RoadmapItem) {
    if (!window.confirm(`Delete "${item.title}"? This action cannot be undone.`)) return;
    setError('');
    try {
      await axios.delete(`${API_URL}/roadmapItems/${item.id}`);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch {
      setError('Could not delete this roadmap item. Please try again.');
    }
  }

  return (
    <DashboardLayout>
      <main className="min-h-full space-y-6 bg-[#faf7f3] text-[#542f1e] dark:bg-[#0b0d0f] dark:text-slate-100">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-[#8b7668] dark:text-slate-400">Plan what comes next</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl"><Map size={28} /> Product Roadmap</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#8b7668] dark:text-slate-400">Share upcoming improvements and track product delivery from planned to completed.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#65371f] dark:bg-[#e5f55b] dark:text-[#171a10]">
            <Plus size={18} /> Add Roadmap Item
          </button>
        </header>

        {error && !modalOpen && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X size={18} /></button></div>}

        <section className="grid gap-4 sm:grid-cols-3">
          {statusOptions.map((status) => (
            <div key={status.value} className="rounded-2xl border border-[#eadfd5] bg-white p-5 dark:border-white/10 dark:bg-[#151a1c]">
              <p className="text-sm text-[#8b7668] dark:text-slate-400">{status.label}</p>
              <p className="mt-2 text-3xl font-bold">{items.filter((item) => item.status === status.value).length}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7668] dark:text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roadmap items..." className="w-full rounded-xl border border-[#eadfd5] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#7c452a] dark:border-white/10 dark:bg-[#151a1c]" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-[#eadfd5] bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#151a1c]">
            <option value="all">All statuses</option>
            {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </section>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#eadfd5] bg-white p-12 text-sm dark:border-white/10 dark:bg-[#151a1c]"><LoaderCircle size={20} className="animate-spin" /> Loading roadmap...</div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d9c7b8] bg-white px-5 py-12 text-center dark:border-white/15 dark:bg-[#151a1c]">
            <Map size={38} className="mx-auto text-[#8b7668] dark:text-slate-400" />
            <h2 className="mt-4 text-lg font-semibold">{query || statusFilter !== 'all' ? 'No matching roadmap items' : 'Your roadmap is ready to build'}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#8b7668] dark:text-slate-400">{query || statusFilter !== 'all' ? 'Try changing your search or status filter.' : 'Add your first roadmap item to share what your team plans to build next.'}</p>
            {!query && statusFilter === 'all' && <button type="button" onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#e5f55b] dark:text-[#171a10]"><Plus size={16} /> Create first item</button>}
          </div>
        ) : (
          <section className="grid gap-4 xl:grid-cols-3">
            {statusOptions.filter((status) => statusFilter === 'all' || statusFilter === status.value).map((status) => {
              const columnItems = filteredItems.filter((item) => item.status === status.value);
              return <div key={status.value} className="min-w-0 rounded-2xl border border-[#eadfd5] bg-[#f5eee8]/70 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2 px-1"><h2 className="font-semibold">{status.label}</h2><span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#755a49] dark:bg-white/10 dark:text-slate-200">{columnItems.length}</span></div>
                <div className="space-y-3">
                  {columnItems.map((item) => <article key={item.id} className="rounded-xl border border-[#eadfd5] bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#151a1c]">
                    <div className="flex items-start justify-between gap-2"><h3 className="break-words font-semibold">{item.title}</h3><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="rounded-lg p-1.5 text-[#8b7668] hover:bg-[#faf7f3] dark:hover:bg-white/5"><Pencil size={15} /></button><button type="button" onClick={() => void handleDelete(item)} aria-label={`Delete ${item.title}`} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={15} /></button></div></div>
                    {item.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5 text-[#8b7668] dark:text-slate-400">{item.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>{status.label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityStyles[item.priority]}`}>{item.priority} priority</span></div>
                    {item.targetDate && <p className="mt-3 flex items-center gap-2 text-xs text-[#8b7668] dark:text-slate-400"><CalendarDays size={14} /> Target {new Date(`${item.targetDate}T00:00:00`).toLocaleDateString()}</p>}
                  </article>)}
                  {columnItems.length === 0 && <div className="rounded-xl border border-dashed border-[#d9c7b8] px-3 py-6 text-center text-xs text-[#8b7668] dark:border-white/10 dark:text-slate-500">No items in this status</div>}
                </div>
              </div>;
            })}
          </section>
        )}

        {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="roadmap-modal-title" className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#eadfd5] bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#151a1c] sm:max-h-[calc(100dvh-2rem)] sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="roadmap-modal-title" className="text-xl font-bold">{editingId ? 'Edit Roadmap Item' : 'Add Roadmap Item'}</h2><p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">Describe the feature and its delivery status.</p></div><button type="button" disabled={saving} onClick={() => setModalOpen(false)} aria-label="Close modal" className="rounded-lg p-2 hover:bg-[#faf7f3] disabled:opacity-50 dark:hover:bg-white/5"><X size={18} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label htmlFor="roadmap-title" className="mb-1 block text-sm font-medium">Title *</label><input id="roadmap-title" required maxLength={100} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Add dark mode" className="w-full rounded-lg border border-[#eadfd5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7c452a] dark:border-white/10 dark:bg-[#0b0d0f]" /></div>
              <div><label htmlFor="roadmap-description" className="mb-1 block text-sm font-medium">Description</label><textarea id="roadmap-description" rows={3} maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What will this feature do?" className="w-full resize-y rounded-lg border border-[#eadfd5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7c452a] dark:border-white/10 dark:bg-[#0b0d0f]" /></div>
              <div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="roadmap-status" className="mb-1 block text-sm font-medium">Status</label><select id="roadmap-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as RoadmapStatus })} className="w-full rounded-lg border border-[#eadfd5] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div><div><label htmlFor="roadmap-priority" className="mb-1 block text-sm font-medium">Priority</label><select id="roadmap-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as RoadmapPriority })} className="w-full rounded-lg border border-[#eadfd5] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">{(['low', 'medium', 'high'] as RoadmapPriority[]).map((priority) => <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>)}</select></div></div>
              <div><label htmlFor="roadmap-date" className="mb-1 block text-sm font-medium">Target date (optional)</label><input id="roadmap-date" type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} className="w-full rounded-lg border border-[#eadfd5] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#0b0d0f]" /></div>
              {error && <p role="alert" className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"><CircleAlert size={16} className="mt-0.5 shrink-0" />{error}</p>}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="rounded-xl border border-[#eadfd5] px-4 py-2.5 text-sm font-semibold hover:bg-[#faf7f3] disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#65371f] disabled:opacity-60 dark:bg-[#e5f55b] dark:text-[#171a10]">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Item'}</button></div>
            </form>
          </div>
        </div>}
      </main>
    </DashboardLayout>
  );
}
