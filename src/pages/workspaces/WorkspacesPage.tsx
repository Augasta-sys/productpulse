import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  Building2,
  Check,
  Globe,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Workspace {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  brandColor: string;
  publicRoadmapEnabled: boolean;
}

interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  status: string;
}

interface FeedbackRecord {
  id: string;
  workspaceId: string;
}

const emptyForm = {
  name: '',
  description: '',
  logoUrl: '',
  brandColor: '#6366f1',
  publicRoadmapEnabled: true,
};

export default function WorkspacesPage() {
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [workspaceResponse, memberResponse, feedbackResponse] =
        await Promise.all([
          axios.get<Workspace[]>(`${API_URL}/workspaces`),
          axios.get<WorkspaceMember[]>(`${API_URL}/workspaceMembers`),
          axios.get<FeedbackRecord[]>(`${API_URL}/feedback`),
        ]);

      setWorkspaces(workspaceResponse.data);
      setMembers(memberResponse.data);
      setFeedback(feedbackResponse.data);
    } catch {
      setError(
        'Unable to load workspaces. Check that JSON Server is running on port 5000.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(workspace: Workspace) {
    setEditingId(workspace.id);
    setForm({
      name: workspace.name,
      description: workspace.description || '',
      logoUrl: workspace.logoUrl || '',
      brandColor: workspace.brandColor || '#6366f1',
      publicRoadmapEnabled: workspace.publicRoadmapEnabled ?? false,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setError('Please enter a workspace name.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = { ...form, name };

    try {
      if (editingId) {
        const response = await axios.patch<Workspace>(
          `${API_URL}/workspaces/${editingId}`,
          payload,
        );

        setWorkspaces((current) =>
          current.map((workspace) =>
            workspace.id === editingId ? response.data : workspace,
          ),
        );
      } else {
        const response = await axios.post<Workspace>(
          `${API_URL}/workspaces`,
          payload,
        );

        const newWorkspace = response.data;
        setWorkspaces((current) => [...current, newWorkspace]);

        // Add the creator as the owner of the new workspace.
        if (user?.id) {
          try {
            const membershipResponse = await axios.post<WorkspaceMember>(
              `${API_URL}/workspaceMembers`,
              {
                id: `member-${Date.now()}`,
                workspaceId: newWorkspace.id,
                userId: user.id,
                role: 'owner',
                status: 'active',
              },
            );

            setMembers((current) => [...current, membershipResponse.data]);
          } catch {
            setError(
              'Workspace created, but its owner membership could not be saved. Please check JSON Server.',
            );
            return;
          }
        }
      }

      setModalOpen(false);
      setForm({ ...emptyForm });
      setEditingId(null);
    } catch {
      setError('Could not save the workspace. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublicRoadmap(workspace: Workspace) {
    setError('');

    try {
      const response = await axios.patch<Workspace>(
        `${API_URL}/workspaces/${workspace.id}`,
        { publicRoadmapEnabled: !workspace.publicRoadmapEnabled },
      );

      setWorkspaces((current) =>
        current.map((item) =>
          item.id === workspace.id ? response.data : item,
        ),
      );
    } catch {
      setError('Could not update the public roadmap setting.');
    }
  }

  async function handleDelete(workspace: Workspace) {
    const relatedFeedback = feedback.filter(
      (item) => item.workspaceId === workspace.id,
    );

    const relatedMembers = members.filter(
      (item) => item.workspaceId === workspace.id,
    );

    if (relatedFeedback.length > 0) {
      setError(
        `Cannot delete "${workspace.name}" because it contains feedback. Move or remove its data first.`,
      );
      return;
    }

    if (
      !window.confirm(
        `Delete "${workspace.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError('');

    try {
      // Remove memberships before deleting the workspace.
      await Promise.all(
        relatedMembers.map((member) =>
          axios.delete(`${API_URL}/workspaceMembers/${member.id}`),
        ),
      );

      await axios.delete(`${API_URL}/workspaces/${workspace.id}`);

      setMembers((current) =>
        current.filter((member) => member.workspaceId !== workspace.id),
      );
      setWorkspaces((current) =>
        current.filter((item) => item.id !== workspace.id),
      );
    } catch {
      setError(
        'Could not delete the workspace. Refresh the page and try again.',
      );
      await loadData();
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-full space-y-6 bg-[#faf7f3] text-[#542f1e] dark:bg-[#0b0d0f] dark:text-slate-100">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-[#8b7668] dark:text-slate-400">
              Manage your product workspace
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Workspaces
            </h1>
            <p className="mt-2 text-sm text-[#8b7668] dark:text-slate-400">
              Organize feedback, manage branding, and control roadmap visibility.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#65371f] dark:bg-[#e5f55b] dark:text-[#171a10] dark:hover:bg-[#d4e64b]"
          >
            <Plus size={18} />
            Create Workspace
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#eadfd5] bg-white p-5 dark:border-white/10 dark:bg-[#151a1c]">
            <p className="text-sm text-[#8b7668] dark:text-slate-400">
              Total Workspaces
            </p>
            <p className="mt-2 text-3xl font-bold">{workspaces.length}</p>
          </div>

          <div className="rounded-2xl border border-[#eadfd5] bg-white p-5 dark:border-white/10 dark:bg-[#151a1c]">
            <p className="text-sm text-[#8b7668] dark:text-slate-400">
              Total Memberships
            </p>
            <p className="mt-2 text-3xl font-bold">{members.length}</p>
          </div>

          <div className="rounded-2xl border border-[#eadfd5] bg-white p-5 dark:border-white/10 dark:bg-[#151a1c]">
            <p className="text-sm text-[#8b7668] dark:text-slate-400">
              Public Roadmaps
            </p>
            <p className="mt-2 text-3xl font-bold">
              {workspaces.filter((item) => item.publicRoadmapEnabled).length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#eadfd5] bg-white p-12 text-sm dark:border-white/10 dark:bg-[#151a1c]">
            <LoaderCircle className="animate-spin" size={20} />
            Loading workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d9c7b8] bg-white p-10 text-center dark:border-white/15 dark:bg-[#151a1c]">
            <Building2 className="mx-auto" size={36} />
            <h2 className="mt-4 text-lg font-semibold">No workspaces yet</h2>
            <p className="mt-2 text-sm text-[#8b7668] dark:text-slate-400">
              Create your first workspace to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {workspaces.map((workspace) => {
              const memberCount = members.filter(
                (member) =>
                  member.workspaceId === workspace.id &&
                  member.status === 'active',
              ).length;

              const feedbackCount = feedback.filter(
                (item) => item.workspaceId === workspace.id,
              ).length;

              return (
                <article
                  key={workspace.id}
                  className="overflow-hidden rounded-2xl border border-[#eadfd5] bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#151a1c]"
                >
                  <div
                    className="h-2"
                    style={{ backgroundColor: workspace.brandColor || '#6366f1' }}
                  />

                  <div className="space-y-5 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white"
                        style={{
                          backgroundColor: workspace.brandColor || '#6366f1',
                        }}
                      >
                        {workspace.logoUrl ? (
                          <img
                            src={workspace.logoUrl}
                            alt={`${workspace.name} logo`}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 size={23} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-lg font-bold">
                          {workspace.name}
                        </h2>
                        <p className="mt-1 break-words text-sm text-[#8b7668] dark:text-slate-400">
                          {workspace.description || 'No description provided.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditModal(workspace)}
                        aria-label={`Edit ${workspace.name}`}
                        className="rounded-lg border border-[#eadfd5] p-2 transition hover:bg-[#faf7f3] dark:border-white/10 dark:hover:bg-white/5"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#faf7f3] p-3 dark:bg-white/5">
                        <p className="text-xs text-[#8b7668] dark:text-slate-400">
                          Active Members
                        </p>
                        <p className="mt-1 text-xl font-bold">{memberCount}</p>
                      </div>
                      <div className="rounded-xl bg-[#faf7f3] p-3 dark:bg-white/5">
                        <p className="text-xs text-[#8b7668] dark:text-slate-400">
                          Feedback Items
                        </p>
                        <p className="mt-1 text-xl font-bold">{feedbackCount}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[#eadfd5] pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Globe size={17} className="text-[#8b7668] dark:text-slate-400" />
                        <div>
                          <p className="text-sm font-medium">Public roadmap</p>
                          <p className="text-xs text-[#8b7668] dark:text-slate-400">
                            {workspace.publicRoadmapEnabled
                              ? 'Visible to the public'
                              : 'Private'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={workspace.publicRoadmapEnabled}
                        aria-label={`Toggle public roadmap for ${workspace.name}`}
                        onClick={() => void togglePublicRoadmap(workspace)}
                        className={`relative h-6 w-11 rounded-full transition ${
                          workspace.publicRoadmapEnabled
                            ? 'bg-emerald-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                            workspace.publicRoadmapEnabled
                              ? 'left-6'
                              : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex justify-end border-t border-[#eadfd5] pt-3 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => void handleDelete(workspace)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={16} />
                        Delete workspace
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-2 backdrop-blur-sm sm:p-3"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                setModalOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="workspace-modal-title"
              className="w-full max-w-lg max-h-[calc(100dvh-1rem)] overflow-hidden rounded-2xl border border-[#eadfd5] bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#151a1c] sm:max-h-[calc(100dvh-1.5rem)] sm:p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 id="workspace-modal-title" className="text-lg font-bold">
                    {editingId ? 'Edit Workspace' : 'Create Workspace'}
                  </h2>
                  <p className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">
                    Configure your workspace details and branding.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  aria-label="Close modal"
                  className="rounded-lg p-2 hover:bg-[#faf7f3] disabled:opacity-50 dark:hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div>
                  <label htmlFor="workspace-name" className="mb-1 block text-xs font-medium">
                    Workspace Name *
                  </label>
                  <input
                    id="workspace-name"
                    required
                    maxLength={80}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="e.g. Acme Products"
                    className="w-full rounded-lg border border-[#eadfd5] bg-white px-3 py-2 text-xs outline-none transition focus:border-[#7c452a] focus:ring-2 focus:ring-[#7c452a]/10 dark:border-white/10 dark:bg-[#0b0d0f]"
                  />
                </div>

                <div>
                  <label htmlFor="workspace-description" className="mb-1 block text-xs font-medium">
                    Description
                  </label>
                  <textarea
                    id="workspace-description"
                    rows={2}
                    maxLength={300}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="What is this workspace used for?"
                    className="w-full resize-none rounded-lg border border-[#eadfd5] bg-white px-3 py-2 text-xs outline-none transition focus:border-[#7c452a] focus:ring-2 focus:ring-[#7c452a]/10 dark:border-white/10 dark:bg-[#0b0d0f]"
                  />
                </div>

                <div>
                  <label htmlFor="workspace-logo" className="mb-1 block text-xs font-medium">
                    Logo URL (optional)
                  </label>
                  <input
                    id="workspace-logo"
                    type="url"
                    value={form.logoUrl}
                    onChange={(event) =>
                      setForm({ ...form, logoUrl: event.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-lg border border-[#eadfd5] bg-white px-3 py-2 text-xs outline-none transition focus:border-[#7c452a] focus:ring-2 focus:ring-[#7c452a]/10 dark:border-white/10 dark:bg-[#0b0d0f]"
                  />
                </div>

                <div>
                  <label htmlFor="workspace-color" className="mb-1 block text-xs font-medium">
                    Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="workspace-color"
                      type="color"
                      value={form.brandColor}
                      onChange={(event) =>
                        setForm({ ...form, brandColor: event.target.value })
                      }
                      className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <span className="text-sm text-[#8b7668] dark:text-slate-400">
                      {form.brandColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#eadfd5] p-2 dark:border-white/10">
                  <input
                    type="checkbox"
                    checked={form.publicRoadmapEnabled}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        publicRoadmapEnabled: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#7c452a]"
                  />
                  <span>
                    <span className="block text-xs font-medium">
                      Enable public roadmap
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#8b7668] dark:text-slate-400">
                      Allow visitors to view the published roadmap.
                    </span>
                  </span>
                </label>

                {error && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                <div className="flex flex-row justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg border border-[#eadfd5] px-3 py-2 text-xs font-semibold transition hover:bg-[#faf7f3] disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#7c452a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#65371f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e5f55b] dark:text-[#171a10]"
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Save Changes'
                        : 'Create Workspace'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
