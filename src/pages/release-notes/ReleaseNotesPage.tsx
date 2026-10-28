
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ReleaseStatus = 'draft' | 'published';
type ReleaseType = 'feature' | 'improvement' | 'bugfix' | 'security';

interface ReleaseNote {
  id: string;
  workspaceId: string;
  title: string;
  version: string;
  description: string;
  releaseDate: string;
  type: ReleaseType;
  status: ReleaseStatus;
  createdAt?: string;
  updatedAt?: string;
}

const emptyForm = {
  title: '',
  version: '',
  description: '',
  releaseDate: new Date().toISOString().slice(0, 10),
  type: 'feature' as ReleaseType,
  status: 'draft' as ReleaseStatus,
};

const typeOptions: { value: ReleaseType; label: string }[] = [
  { value: 'feature', label: 'New Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'bugfix', label: 'Bug Fix' },
  { value: 'security', label: 'Security' },
];

const typeStyles: Record<ReleaseType, string> = {
  feature:
    'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  improvement:
    'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  bugfix:
    'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  security:
    'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
};

const inputClass =
  'w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm text-[#542f1e] outline-none transition focus:border-[#7c452a] focus:ring-2 focus:ring-[#7c452a]/10 dark:border-white/10 dark:bg-[#0b0d0f] dark:text-slate-100';

export default function ReleaseNotesPage() {
  const { user } = useAuth();
  const workspaceId = String(user?.workspaceId || '');

  const [releases, setReleases] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
  if (!modalOpen) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && !saving) {
      setModalOpen(false);
    }
  }

  window.addEventListener('keydown', handleEscape);

  return () => {
    document.body.style.overflow = previousOverflow;
    window.removeEventListener('keydown', handleEscape);
  };
}, [modalOpen, saving]);

  const loadReleases = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get<ReleaseNote[]>(
        `${API_URL}/releaseNotes`,
      );

      const workspaceReleases = response.data.filter(
        (release) => String(release.workspaceId) === workspaceId,
      );

      setReleases(workspaceReleases);
    } catch (err) {
      console.error('Failed to load release notes:', err);
      setError(
        'Unable to load release notes. Check that JSON Server is running on port 5000.',
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadReleases();
  }, [loadReleases]);

  const publishedCount = releases.filter(
    (release) => release.status === 'published',
  ).length;

  const draftCount = releases.filter(
    (release) => release.status === 'draft',
  ).length;

  const visibleReleases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return releases
      .filter((release) => {
        const matchesSearch = [
          release.title,
          release.version,
          release.description,
        ].some((value) => value.toLowerCase().includes(query));

        return (
          matchesSearch &&
          (statusFilter === 'all' || release.status === statusFilter) &&
          (typeFilter === 'all' || release.type === typeFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() -
          new Date(a.releaseDate).getTime(),
      );
  }, [releases, search, statusFilter, typeFilter]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      releaseDate: new Date().toISOString().slice(0, 10),
    });
    setError('');
    setNotice('');
    setModalOpen(true);
  }

  function openEdit(release: ReleaseNote) {
    setEditingId(release.id);
    setForm({
      title: release.title,
      version: release.version,
      description: release.description,
      releaseDate: release.releaseDate,
      type: release.type,
      status: release.status,
    });
    setError('');
    setNotice('');
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!workspaceId) {
      setError('Your account has no workspace assigned.');
      return;
    }

    if (!form.title.trim() || !form.version.trim()) {
      setError('Enter both the release title and version.');
      return;
    }

    if (!form.description.trim()) {
      setError('Enter a description for this release.');
      return;
    }

    if (!form.releaseDate) {
      setError('Select a release date.');
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();

    const payload = {
      workspaceId,
      title: form.title.trim(),
      version: form.version.trim(),
      description: form.description.trim(),
      releaseDate: form.releaseDate,
      type: form.type,
      status: form.status,
      updatedAt: now,
    };

    try {
      if (editingId) {
        const response = await axios.patch<ReleaseNote>(
          `${API_URL}/releaseNotes/${encodeURIComponent(editingId)}`,
          payload,
        );

        setReleases((current) =>
          current.map((release) =>
            String(release.id) === String(editingId)
              ? { ...release, ...response.data }
              : release,
          ),
        );

        setNotice('Release note updated successfully.');
      } else {
        const response = await axios.post<ReleaseNote>(
          `${API_URL}/releaseNotes`,
          {
            id: `release-${Date.now()}`,
            ...payload,
            createdAt: now,
          },
        );

        setReleases((current) => [...current, response.data]);
        setNotice('Release note created successfully.');
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      console.error('Failed to save release note:', err);

      if (axios.isAxiosError(err)) {
        setError(
          `Could not save the release note${
            err.response?.status ? ` (HTTP ${err.response.status})` : ''
          }. Check JSON Server and try again.`,
        );
      } else {
        setError('An unexpected error occurred while saving.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(release: ReleaseNote) {
    const nextStatus: ReleaseStatus =
      release.status === 'published' ? 'draft' : 'published';

    setError('');
    setNotice('');

    try {
      const response = await axios.patch<ReleaseNote>(
        `${API_URL}/releaseNotes/${encodeURIComponent(release.id)}`,
        {
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        },
      );

      setReleases((current) =>
        current.map((item) =>
          String(item.id) === String(release.id)
            ? { ...item, ...response.data }
            : item,
        ),
      );

      setNotice(
        nextStatus === 'published'
          ? `${release.title} was published successfully.`
          : `${release.title} was moved back to drafts.`,
      );
    } catch (err) {
      console.error('Failed to update release status:', err);
      setError('Could not update the release status.');
    }
  }

  async function handleDelete(release: ReleaseNote) {
    if (
      !window.confirm(
        `Delete "${release.title}" (${release.version})? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError('');
    setNotice('');

    try {
      await axios.delete(
        `${API_URL}/releaseNotes/${encodeURIComponent(release.id)}`,
      );

      setReleases((current) =>
        current.filter((item) => String(item.id) !== String(release.id)),
      );

      setNotice('Release note deleted successfully.');
    } catch (err) {
      console.error('Failed to delete release note:', err);
      setError('Could not delete this release note.');
    }
  }

  return (
    <DashboardLayout>
      <main className="min-h-full space-y-6 bg-[#faf7f3] text-[#542f1e] dark:bg-[#0b0d0f] dark:text-slate-100">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-[#8b7668] dark:text-slate-400">
              Product updates and announcements
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <FileText size={28} />
              Release Notes
            </h1>
            <p className="mt-2 text-sm text-[#8b7668] dark:text-slate-400">
              Create, organize, and publish product updates for your users.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadReleases()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm font-semibold hover:bg-[#f5eee8] disabled:opacity-50 dark:border-white/10 dark:bg-[#151a1c] dark:hover:bg-white/5"
            >
              <RefreshCw
                size={17}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#65371f] dark:bg-[#e5f55b] dark:text-[#171a10]"
            >
              <Plus size={18} />
              Create Release
            </button>
          </div>
        </header>

        {error && !modalOpen && (
          <AlertBanner
            message={error}
            onClose={() => setError('')}
            variant="error"
          />
        )}

        {notice && (
          <AlertBanner
            message={notice}
            onClose={() => setNotice('')}
            variant="success"
          />
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total Releases"
            value={releases.length}
            icon={<FileText size={21} />}
            description="All release notes"
          />
          <StatCard
            label="Published"
            value={publishedCount}
            icon={<Check size={21} />}
            description="Available to users"
          />
          <StatCard
            label="Drafts"
            value={draftCount}
            icon={<Clock size={21} />}
            description="Not published yet"
          />
        </section>

        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="relative sm:col-span-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7668] dark:text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search releases..."
                className={`${inputClass} pl-10`}
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
              aria-label="Filter by release status"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={inputClass}
              aria-label="Filter by release type"
            >
              <option value="all">All release types</option>
              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#eadfd5] bg-white p-12 text-sm dark:border-white/10 dark:bg-[#151a1c]">
              <LoaderCircle size={20} className="animate-spin" />
              Loading release notes...
            </div>
          ) : visibleReleases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9c7b8] bg-white px-5 py-14 text-center dark:border-white/15 dark:bg-[#151a1c]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">
                <FileText size={27} />
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                {search || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No matching releases'
                  : 'No release notes yet'}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#8b7668] dark:text-slate-400">
                {search || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try changing your search or filters.'
                  : 'Share your latest features, improvements, and fixes with your users.'}
              </p>
              {!search &&
                statusFilter === 'all' &&
                typeFilter === 'all' && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#e5f55b] dark:text-[#171a10]"
                  >
                    <Plus size={16} />
                    Create First Release
                  </button>
                )}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleReleases.map((release) => (
                <article
                  key={release.id}
                  className="group rounded-2xl border border-[#eadfd5] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#7c452a]/5 dark:border-white/10 dark:bg-[#151a1c] dark:hover:shadow-black/20 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">
                        <FileText size={21} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold">
                          {release.title}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-[#8b7668] dark:text-slate-400">
                          Version {release.version}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        release.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                      }`}
                    >
                      {release.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        typeStyles[release.type] || typeStyles.feature
                      }`}
                    >
                      {typeOptions.find(
                        (type) => type.value === release.type,
                      )?.label || release.type}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#8b7668] dark:text-slate-400">
                      <CalendarDays size={14} />
                      {formatDate(release.releaseDate)}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#765b4a] dark:text-slate-300">
                    {release.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eadfd5] pt-4 dark:border-white/10">
                    <span className="text-xs text-[#8b7668] dark:text-slate-400">
                      {release.status === 'published'
                        ? 'Visible as published in this workspace'
                        : 'Saved as a draft'}
                    </span>

                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void togglePublish(release)}
                        title={
                          release.status === 'published'
                            ? 'Move to drafts'
                            : 'Publish release'
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#7c452a] hover:bg-[#f5eee8] dark:text-[#e5f55b] dark:hover:bg-white/5"
                      >
                        {release.status === 'published' ? (
                          <Clock size={15} />
                        ) : (
                          <Send size={15} />
                        )}
                        {release.status === 'published'
                          ? 'Unpublish'
                          : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(release)}
                        aria-label={`Edit ${release.title}`}
                        className="rounded-lg p-2 text-[#8b7668] hover:bg-[#f5eee8] dark:hover:bg-white/5"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(release)}
                        aria-label={`Delete ${release.title}`}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

       {modalOpen &&
          createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black/60 p-2 backdrop-blur-sm sm:p-4"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) {
        setModalOpen(false);
      }
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-modal-title"
      className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-[#eadfd5] bg-white p-4 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-white/10 dark:bg-[#151a1c] sm:max-h-[calc(100dvh-2rem)] sm:p-5"
    >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="release-modal-title"
                    className="text-xl font-bold"
                  >
                    {editingId ? 'Edit Release Note' : 'Create Release Note'}
                  </h2>
                  <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">
                    Enter the details of this product update.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  aria-label="Close modal"
                  className="rounded-lg p-2 hover:bg-[#faf7f3] disabled:opacity-50 dark:hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="release-title"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Release title *
                  </label>
                  <input
                    id="release-title"
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    placeholder="e.g. Introducing dark mode"
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="release-version"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Version *
                    </label>
                    <input
                      id="release-version"
                      required
                      maxLength={30}
                      value={form.version}
                      onChange={(event) =>
                        setForm({ ...form, version: event.target.value })
                      }
                      placeholder="e.g. 1.2.0"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="release-date"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Release date *
                    </label>
                    <input
                      id="release-date"
                      type="date"
                      required
                      value={form.releaseDate}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          releaseDate: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="release-type"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Release type *
                  </label>
                  <select
                    id="release-type"
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target.value as ReleaseType,
                      })
                    }
                    className={inputClass}
                  >
                    {typeOptions.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="release-description"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Description *
                  </label>
                  <textarea
                    id="release-description"
                    required
                    minLength={5}
                    maxLength={5000}
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    placeholder="Describe what changed, what improved, and what users should know..."
                  className={`${inputClass} resize-none`}
                  />
                  <p className="mt-1 text-right text-xs text-[#8b7668] dark:text-slate-400">
                    {form.description.length}/5000
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="release-status"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Initial status *
                  </label>
                  <select
                    id="release-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as ReleaseStatus,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0"
                    />
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 border-t border-[#eadfd5] pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-[#eadfd5] px-4 py-2.5 text-sm font-semibold hover:bg-[#faf7f3] disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#65371f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e5f55b] dark:text-[#171a10]"
                  >
                    {saving ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Check size={16} />
                    )}
                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Save Changes'
                        : 'Create Release'}
                  </button>
                </div>
              </form>
            </div>
            </div>,
            document.body,
          )}
      </main>
    </DashboardLayout>
  );
}

function formatDate(value: string) {
  if (!value) return 'No date';

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfd5] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#151a1c]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#8b7668] dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-xs text-[#8b7668] dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function AlertBanner({
  message,
  onClose,
  variant,
}: {
  message: string;
  onClose: () => void;
  variant: 'error' | 'success';
}) {
  const styles =
    variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300';

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-sm ${styles}`}
    >
      <span className="flex items-start gap-2">
        {variant === 'error' ? (
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
        ) : (
          <Check size={17} className="mt-0.5 shrink-0" />
        )}
        {message}
      </span>
      <button type="button" onClick={onClose} aria-label="Dismiss message">
        <X size={17} />
      </button>
    </div>
  );
}
