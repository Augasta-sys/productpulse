import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Building2,
  Check,
  Globe,
  LoaderCircle,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

interface Workspace {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  supportEmail?: string;
  timezone?: string;
  defaultFeedbackStatus?: string;
  allowGuestFeedback?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type SettingsTab = 'general' | 'preferences' | 'access';

const inputClass =
  'w-full min-w-0 rounded-xl border border-[#eadfd5] bg-white px-3 py-2.5 text-sm text-[#542f1e] outline-none transition placeholder:text-[#a28a7a] focus:border-[#7c452a] focus:ring-2 focus:ring-[#7c452a]/10 dark:border-white/10 dark:bg-[#0b0d0f] dark:text-slate-100 dark:placeholder:text-slate-500';

const initialWorkspace: Workspace = {
  id: '',
  name: '',
  description: '',
  logo: '',
  website: '',
  supportEmail: '',
  timezone: 'Asia/Kolkata',
  defaultFeedbackStatus: 'open',
  allowGuestFeedback: true,
};

export default function WorkspaceSettingsPage() {
  const { user } = useAuth();
  const workspaceId = String(user?.workspaceId || '');

  const [workspace, setWorkspace] =
    useState<Workspace>(initialWorkspace);
  const [form, setForm] = useState<Workspace>(initialWorkspace);
  const [activeTab, setActiveTab] =
    useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');

    if (!workspaceId) {
      setError(
        'Your account has no workspace assigned. Check the signed-in user and workspace membership.',
      );
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get<Workspace[]>(
        `${API_URL}/workspaces`,
      );

      const found = response.data.find(
        (item) => String(item.id) === workspaceId,
      );

      if (!found) {
        setError(
          'The workspace assigned to your account could not be found.',
        );
        return;
      }

      const normalized: Workspace = {
        ...initialWorkspace,
        ...found,
        id: String(found.id),
      };

      setWorkspace(normalized);
      setForm(normalized);
    } catch (err) {
      console.error('Failed to load workspace settings:', err);
      setError(
        'Could not load workspace settings. Check the API URL and backend connection.',
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!confirmOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        setConfirmOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [confirmOpen, saving]);

  const isDirty =
    form.name !== workspace.name ||
    form.description !== workspace.description ||
    form.logo !== workspace.logo ||
    form.website !== workspace.website ||
    form.supportEmail !== workspace.supportEmail ||
    form.timezone !== workspace.timezone ||
    form.defaultFeedbackStatus !==
      workspace.defaultFeedbackStatus ||
    form.allowGuestFeedback !== workspace.allowGuestFeedback;

  function updateForm<K extends keyof Workspace>(
    key: K,
    value: Workspace[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!form.name.trim()) {
      setError('Workspace name is required.');
      setActiveTab('general');
      return;
    }

    if (
      form.website &&
      !/^https?:\/\/.+\..+/.test(form.website.trim())
    ) {
      setError(
        'Enter a valid website URL starting with http:// or https://.',
      );
      setActiveTab('general');
      return;
    }

    if (
      form.supportEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.supportEmail.trim(),
      )
    ) {
      setError('Enter a valid support email address.');
      setActiveTab('general');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        logo: form.logo?.trim() || '',
        website: form.website?.trim() || '',
        supportEmail: form.supportEmail?.trim() || '',
        timezone: form.timezone || 'Asia/Kolkata',
        defaultFeedbackStatus:
          form.defaultFeedbackStatus || 'open',
        allowGuestFeedback: Boolean(form.allowGuestFeedback),
        updatedAt: new Date().toISOString(),
      };

      const response = await axios.patch<Workspace>(
        `${API_URL}/workspaces/${encodeURIComponent(workspace.id)}`,
        payload,
      );

      const updated = {
        ...workspace,
        ...response.data,
      };

      setWorkspace(updated);
      setForm(updated);
      setNotice('Workspace settings saved successfully.');
    } catch (err) {
      console.error('Failed to save workspace settings:', err);
      setError(
        'Could not save workspace settings. Check the API connection and confirm that this workspace exists.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(workspace);
    setError('');
    setNotice('');
    setConfirmOpen(false);
  }

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: 'general',
      label: 'General',
      icon: <Building2 size={17} />,
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Settings2 size={17} />,
    },
    {
      id: 'access',
      label: 'Feedback access',
      icon: <ShieldCheck size={17} />,
    },
  ];

  return (
    <DashboardLayout>
      <main className="mx-auto min-h-full w-full min-w-0 max-w-[1600px] space-y-4 bg-[#faf7f3] px-3 py-4 text-[#542f1e] sm:space-y-6 sm:px-5 sm:py-6 lg:px-8 2xl:px-10 dark:bg-[#0b0d0f] dark:text-slate-100">
        {/* Page heading */}
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs leading-5 text-[#8b7668] sm:text-sm dark:text-slate-400">
              Manage your workspace details and preferences
            </p>

            <h1 className="mt-1 flex min-w-0 items-center gap-2 text-xl font-bold sm:text-2xl lg:text-3xl">
              <Settings2
                size={25}
                className="shrink-0 sm:h-7 sm:w-7"
              />
              <span className="break-words">
                Workspace Settings
              </span>
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-5 text-[#8b7668] dark:text-slate-400">
              Configure workspace information, defaults, and feedback
              access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadWorkspace()}
            disabled={loading}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#eadfd5] bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-[#f5eee8] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-white/10 dark:bg-[#151a1c] dark:hover:bg-white/5"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </header>

        {error && (
          <Alert
            message={error}
            variant="error"
            onClose={() => setError('')}
          />
        )}

        {notice && (
          <Alert
            message={notice}
            variant="success"
            onClose={() => setNotice('')}
          />
        )}

        {/* Responsive sidebar and content */}
        <section className="grid min-w-0 grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-[230px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit min-w-0 rounded-2xl border border-[#eadfd5] bg-white p-3 sm:p-4 dark:border-white/10 dark:bg-[#151a1c]">
            <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a28a7a] sm:text-xs">
              Workspace settings
            </p>

            <nav
              aria-label="Workspace settings sections"
              className="grid grid-cols-3 gap-1.5 min-[420px]:gap-2 xl:grid-cols-1"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={
                    activeTab === tab.id ? 'page' : undefined
                  }
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError('');
                    setNotice('');
                  }}
                  className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-3 text-center text-[11px] font-semibold leading-4 transition min-[420px]:flex-row min-[420px]:gap-2 min-[420px]:px-2 min-[420px]:text-xs min-[420px]:text-left xl:justify-start xl:px-3 xl:py-3 xl:text-sm ${
                    activeTab === tab.id
                      ? 'bg-[#7c452a] text-white shadow-sm dark:bg-[#e5f55b] dark:text-[#171a10]'
                      : 'text-[#765b4a] hover:bg-[#faf7f3] dark:text-slate-300 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="min-w-0 break-words">
                    {tab.label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-3 min-w-0 rounded-xl bg-[#faf7f3] p-3 sm:mt-4 dark:bg-white/5">
              <div className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                <Globe size={16} className="shrink-0" />
                Workspace ID
              </div>

              <p className="mt-1 break-all text-xs leading-5 text-[#8b7668] dark:text-slate-400">
                {workspace.id || workspaceId || 'Not assigned'}
              </p>
            </div>
          </aside>

          <form
            onSubmit={handleSave}
            className="min-w-0 overflow-hidden rounded-2xl border border-[#eadfd5] bg-white dark:border-white/10 dark:bg-[#151a1c]"
          >
            {/* Form heading */}
            <div className="flex min-w-0 flex-col gap-3 border-b border-[#eadfd5] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:p-6 dark:border-white/10">
              <div className="min-w-0">
                <h2 className="break-words text-base font-bold sm:text-lg">
                  {activeTab === 'general'
                    ? 'General information'
                    : activeTab === 'preferences'
                      ? 'Workspace preferences'
                      : 'Feedback access'}
                </h2>

                <p className="mt-1 text-sm leading-5 text-[#8b7668] dark:text-slate-400">
                  {activeTab === 'general'
                    ? 'Update the public details for your workspace.'
                    : activeTab === 'preferences'
                      ? 'Set default values for new feedback.'
                      : 'Choose how people can submit feedback.'}
                </p>
              </div>

              <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {loading ? 'Loading' : 'Workspace'}
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-[#8b7668] sm:p-14 dark:text-slate-400">
                <LoaderCircle
                  size={22}
                  className="animate-spin"
                />
                Loading workspace settings...
              </div>
            ) : (
              <>
                <div className="min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-5 lg:p-6">
                  {/* General tab */}
                  {activeTab === 'general' && (
                    <>
                      <div className="flex min-w-0 flex-col gap-4 rounded-xl bg-[#faf7f3] p-3 sm:flex-row sm:items-start sm:p-4 dark:bg-white/5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#7c452a] text-lg font-bold text-white sm:h-16 sm:w-16 dark:bg-[#e5f55b] dark:text-[#171a10]">
                          {form.logo ? (
                            <img
                              src={form.logo}
                              alt="Workspace logo"
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            form.name.trim().slice(0, 2).toUpperCase() ||
                            'WS'
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold">
                            Workspace identity
                          </h3>

                          <p className="mt-1 text-sm leading-5 text-[#8b7668] dark:text-slate-400">
                            This information helps your team identify the
                            workspace.
                          </p>

                          <label
                            className="mt-3 block text-sm font-medium"
                            htmlFor="workspace-logo"
                          >
                            Logo image URL
                          </label>

                          <input
                            id="workspace-logo"
                            type="url"
                            value={form.logo || ''}
                            onChange={(event) =>
                              updateForm('logo', event.target.value)
                            }
                            placeholder="https://example.com/logo.png"
                            className={`${inputClass} mt-1`}
                          />
                        </div>
                      </div>

                      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                        <Field
                          label="Workspace name *"
                          htmlFor="workspace-name"
                        >
                          <input
                            id="workspace-name"
                            required
                            maxLength={100}
                            value={form.name}
                            onChange={(event) =>
                              updateForm('name', event.target.value)
                            }
                            placeholder="e.g. Acme Products"
                            className={inputClass}
                          />
                        </Field>

                        <Field
                          label="Website"
                          htmlFor="workspace-website"
                        >
                          <input
                            id="workspace-website"
                            type="url"
                            value={form.website || ''}
                            onChange={(event) =>
                              updateForm('website', event.target.value)
                            }
                            placeholder="https://example.com"
                            className={inputClass}
                          />
                        </Field>

                        <Field
                          label="Support email"
                          htmlFor="workspace-email"
                        >
                          <input
                            id="workspace-email"
                            type="email"
                            value={form.supportEmail || ''}
                            onChange={(event) =>
                              updateForm(
                                'supportEmail',
                                event.target.value,
                              )
                            }
                            placeholder="support@example.com"
                            className={inputClass}
                          />
                        </Field>

                        <Field
                          label="Workspace timezone"
                          htmlFor="workspace-timezone"
                        >
                          <select
                            id="workspace-timezone"
                            value={form.timezone || 'Asia/Kolkata'}
                            onChange={(event) =>
                              updateForm('timezone', event.target.value)
                            }
                            className={inputClass}
                          >
                            <option value="Asia/Kolkata">
                              India Standard Time (IST)
                            </option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">
                              Eastern Time (US)
                            </option>
                            <option value="America/Los_Angeles">
                              Pacific Time (US)
                            </option>
                            <option value="Europe/London">
                              United Kingdom
                            </option>
                            <option value="Asia/Singapore">
                              Singapore
                            </option>
                          </select>
                        </Field>
                      </div>

                      <Field
                        label="Description"
                        htmlFor="workspace-description"
                      >
                        <textarea
                          id="workspace-description"
                          rows={4}
                          maxLength={500}
                          value={form.description || ''}
                          onChange={(event) =>
                            updateForm(
                              'description',
                              event.target.value,
                            )
                          }
                          placeholder="Describe your workspace and what your team builds..."
                          className={`${inputClass} resize-y`}
                        />

                        <p className="mt-1 text-right text-xs text-[#8b7668] dark:text-slate-400">
                          {(form.description || '').length}/500
                        </p>
                      </Field>
                    </>
                  )}

                  {/* Preferences tab */}
                  {activeTab === 'preferences' && (
                    <div className="w-full min-w-0 space-y-5 xl:max-w-3xl">
                      <Field
                        label="Default feedback status"
                        htmlFor="default-feedback-status"
                      >
                        <select
                          id="default-feedback-status"
                          value={form.defaultFeedbackStatus || 'open'}
                          onChange={(event) =>
                            updateForm(
                              'defaultFeedbackStatus',
                              event.target.value,
                            )
                          }
                          className={inputClass}
                        >
                          <option value="open">Open</option>
                          <option value="under_review">
                            Under review
                          </option>
                          <option value="planned">Planned</option>
                        </select>

                        <p className="mt-1.5 text-xs leading-5 text-[#8b7668] dark:text-slate-400">
                          Applied as the default status for new feedback
                          items where supported.
                        </p>
                      </Field>

                      <div className="min-w-0 rounded-xl border border-[#eadfd5] p-3 sm:p-4 dark:border-white/10">
                        <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold">
                              Guest feedback
                            </h3>

                            <p className="mt-1 text-sm leading-5 text-[#8b7668] dark:text-slate-400">
                              Allow people to submit feedback without
                              being workspace members.
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-label="Allow guest feedback"
                            aria-checked={Boolean(
                              form.allowGuestFeedback,
                            )}
                            onClick={() =>
                              updateForm(
                                'allowGuestFeedback',
                                !form.allowGuestFeedback,
                              )
                            }
                            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#7c452a]/40 ${
                              form.allowGuestFeedback
                                ? 'bg-[#7c452a] dark:bg-[#e5f55b]'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                form.allowGuestFeedback
                                  ? 'left-6'
                                  : 'left-1'
                              } ${
                                form.allowGuestFeedback
                                  ? 'dark:bg-[#171a10]'
                                  : ''
                              }`}
                            />
                          </button>
                        </div>

                        <p className="mt-3 text-xs leading-5 text-[#8b7668] dark:text-slate-400">
                          {form.allowGuestFeedback
                            ? 'Guest submissions are enabled in this setting.'
                            : 'Only signed-in workspace users should submit feedback in this setting.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Feedback access tab */}
                  {activeTab === 'access' && (
                    <div className="min-w-0 space-y-4">
                      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900 sm:p-4 dark:border-blue-400/20 dark:bg-blue-400/5 dark:text-blue-200">
                        <ShieldCheck
                          size={20}
                          className="mt-0.5 shrink-0"
                        />

                        <div className="min-w-0">
                          <h3 className="font-semibold">
                            Feedback access settings
                          </h3>

                          <p className="mt-1 text-sm leading-5">
                            These preferences describe how your workspace
                            intends to accept feedback. Enforce access rules
                            in your API before using them in production.
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 rounded-xl border border-[#eadfd5] p-3 sm:p-4 dark:border-white/10">
                        <p className="text-sm text-[#8b7668] dark:text-slate-400">
                          Guest submissions
                        </p>

                        <p className="mt-1 break-words font-semibold">
                          {form.allowGuestFeedback
                            ? 'Allowed by workspace setting'
                            : 'Disabled by workspace setting'}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl border border-[#eadfd5] p-3 sm:p-4 dark:border-white/10">
                        <p className="text-sm text-[#8b7668] dark:text-slate-400">
                          Default new feedback status
                        </p>

                        <p className="mt-1 break-words font-semibold capitalize">
                          {(form.defaultFeedbackStatus || 'open').replace(
                            '_',
                            ' ',
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('preferences')}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#eadfd5] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#faf7f3] sm:w-auto dark:border-white/10 dark:hover:bg-white/5"
                      >
                        Edit feedback preferences
                      </button>
                    </div>
                  )}
                </div>

                {/* Responsive form actions */}
                <div className="flex min-w-0 flex-col gap-3 border-t border-[#eadfd5] bg-[#faf7f3]/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 dark:border-white/10 dark:bg-white/[0.02]">
                  <p className="text-xs leading-5 text-[#8b7668] dark:text-slate-400">
                    {isDirty
                      ? 'You have unsaved changes.'
                      : 'All changes are saved.'}
                  </p>

                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:flex">
                    <button
                      type="button"
                      disabled={!isDirty || saving}
                      onClick={() => setConfirmOpen(true)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#eadfd5] px-4 py-2.5 text-sm font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      Discard changes
                    </button>

                    <button
                      type="submit"
                      disabled={!isDirty || saving || loading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#65371f] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#e5f55b] dark:text-[#171a10]"
                    >
                      {saving ? (
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
        </section>

        {/* Discard confirmation modal */}
        {confirmOpen &&
          createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-5"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  !saving
                ) {
                  setConfirmOpen(false);
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="discard-title"
                className="my-auto w-full max-w-md rounded-2xl border border-[#eadfd5] bg-white p-4 shadow-2xl sm:p-6 dark:border-white/10 dark:bg-[#151a1c]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      id="discard-title"
                      className="break-words text-lg font-bold"
                    >
                      Discard unsaved changes?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#8b7668] dark:text-slate-400">
                      Your edits will be reset to the last saved workspace
                      settings.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    aria-label="Close dialog"
                    className="shrink-0 rounded-lg p-2 transition hover:bg-[#faf7f3] dark:hover:bg-white/5"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#eadfd5] px-4 py-2.5 text-sm font-semibold dark:border-white/10"
                  >
                    Keep editing
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#e5f55b] dark:text-[#171a10]"
                  >
                    Discard changes
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </main>
    </DashboardLayout>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Alert({
  message,
  variant,
  onClose,
}: {
  message: string;
  variant: 'error' | 'success';
  onClose: () => void;
}) {
  const style =
    variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300';

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex min-w-0 items-start justify-between gap-3 rounded-xl border p-3 text-sm sm:p-4 ${style}`}
    >
      <span className="flex min-w-0 items-start gap-2">
        {variant === 'error' ? (
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />
        ) : (
          <Check size={17} className="mt-0.5 shrink-0" />
        )}
        <span className="break-words">{message}</span>
      </span>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="shrink-0 rounded p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
}