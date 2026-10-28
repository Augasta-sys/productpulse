
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import axios from 'axios';
import {
  Check,
  CircleAlert,
  LoaderCircle,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Role = 'owner' | 'admin' | 'product_manager' | 'customer';
type MemberStatus = 'active' | 'inactive';
type FormMode = 'existing' | 'new';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  status?: string;
}

interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  status: MemberStatus;
}

interface TeamMember extends WorkspaceMember {
  name: string;
  email: string;
  userStatus?: string;
}

const roleOptions: { value: Role; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'customer', label: 'Customer' },
];

const statusOptions: { value: MemberStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const roleStyles: Record<Role, string> = {
  owner:
    'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  admin:
    'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  product_manager:
    'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  customer:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
};

const emptyForm = {
  userId: '',
  name: '',
  email: '',
  password: '',
  role: 'customer' as Role,
  status: 'active' as MemberStatus,
};

export default function TeamPage() {
  const { user } = useAuth();
  const workspaceId = String(user?.workspaceId || '');

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('new');
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [usersResponse, membersResponse] = await Promise.all([
        axios.get<UserRecord[]>(`${API_URL}/users`),
        axios.get<WorkspaceMember[]>(`${API_URL}/workspaceMembers`),
      ]);

      const fetchedUsers = usersResponse.data;
      const fetchedMemberships = membersResponse.data;

      setUsers(fetchedUsers);

      const workspaceMembers = fetchedMemberships.filter(
        (member) => String(member.workspaceId) === workspaceId,
      );

      const joinedMembers: TeamMember[] = workspaceMembers.map((member) => {
        const record = fetchedUsers.find(
          (item) => String(item.id) === String(member.userId),
        );

        return {
          ...member,
          name: record?.name || 'Unknown user',
          email: record?.email || 'No email available',
          userStatus: record?.status,
        };
      });

      setMembers(joinedMembers);
    } catch (err) {
      console.error('Failed to load team data:', err);
      setError(
        'Unable to load team members. Check JSON Server and your workspace assignment.',
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableUsers = useMemo(() => {
    const memberUserIds = new Set(
      members.map((member) => String(member.userId)),
    );

    return users.filter(
      (record) => !memberUserIds.has(String(record.id)),
    );
  }, [users, members]);

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (roleFilter === 'all' || member.role === roleFilter) &&
        (statusFilter === 'all' || member.status === statusFilter)
      );
    });
  }, [members, search, roleFilter, statusFilter]);

  const inputClass =
    'w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm text-[#542f1e] outline-none focus:border-[#7c452a] focus:ring-2 focus:ring-[#7c452a]/10 dark:border-white/10 dark:bg-[#0b0d0f] dark:text-slate-100';

  function openCreate() {
    setEditingId(null);
    setFormMode(availableUsers.length > 0 ? 'existing' : 'new');
    setForm({
      ...emptyForm,
      userId: availableUsers[0]?.id || '',
    });
    setError('');
    setNotice('');
    setModalOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditingId(member.id);
    setFormMode('existing');
    setForm({
      ...emptyForm,
      userId: member.userId,
      role: member.role,
      status: member.status,
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
      setError(
        'Your account has no workspace assigned. Please check your AuthContext and workspace membership.',
      );
      return;
    }

    if (formMode === 'new' && !editingId) {
      if (!form.name.trim()) {
        setError('Enter the new member’s name.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError('Enter a valid email address.');
        return;
      }

      if (form.password.length < 6) {
        setError('Password must contain at least 6 characters.');
        return;
      }
    }

    if (formMode === 'existing' && !editingId && !form.userId) {
      setError('Select an existing user or switch to Create New Member.');
      return;
    }

    setSaving(true);

    let createdUserId: string | null = null;

    try {
      if (editingId) {
        const currentMember = members.find(
          (member) => String(member.id) === String(editingId),
        );

        if (!currentMember) {
          setError('The selected team member could not be found.');
          return;
        }

        const response = await axios.patch<WorkspaceMember>(
          `${API_URL}/workspaceMembers/${encodeURIComponent(editingId)}`,
          {
            role: form.role,
            status: form.status,
          },
        );

        const userRecord = users.find(
          (record) =>
            String(record.id) === String(currentMember.userId),
        );

        setMembers((current) =>
          current.map((member) =>
            String(member.id) === String(editingId)
              ? {
                  ...member,
                  ...response.data,
                  name: userRecord?.name || member.name,
                  email: userRecord?.email || member.email,
                }
              : member,
          ),
        );

        setNotice('Team member updated successfully.');
      } else {
        let selectedUserId = form.userId;

        if (formMode === 'new') {
          const normalizedEmail = form.email.trim().toLowerCase();

          const duplicateEmail = users.some(
            (record) =>
              record.email.trim().toLowerCase() === normalizedEmail,
          );

          if (duplicateEmail) {
            setError(
              'An account with this email already exists. Select that user from the existing-user list instead.',
            );
            return;
          }

          const newUser: UserRecord = {
            id: `user-${Date.now()}`,
            name: form.name.trim(),
            email: normalizedEmail,
            password: form.password,
            status: 'active',
          };

          const userResponse = await axios.post<UserRecord>(
            `${API_URL}/users`,
            newUser,
          );

          selectedUserId = String(userResponse.data.id);
          createdUserId = selectedUserId;
        }

        const alreadyExists = members.some(
          (member) =>
            String(member.userId) === String(selectedUserId),
        );

        if (alreadyExists) {
          setError('This user is already a member of the workspace.');
          return;
        }

        try {
          const memberResponse = await axios.post<WorkspaceMember>(
            `${API_URL}/workspaceMembers`,
            {
              id: `member-${Date.now()}`,
              workspaceId,
              userId: selectedUserId,
              role: form.role,
              status: form.status,
            },
          );

          const userRecord =
            users.find(
              (record) =>
                String(record.id) === String(selectedUserId),
            ) ||
            (createdUserId
              ? {
                  id: selectedUserId,
                  name: form.name.trim(),
                  email: form.email.trim().toLowerCase(),
                  status: 'active',
                }
              : undefined);

          setMembers((current) => [
            ...current,
            {
              ...memberResponse.data,
              name: userRecord?.name || 'Unknown user',
              email: userRecord?.email || 'No email available',
              userStatus: userRecord?.status,
            },
          ]);

          if (createdUserId) {
            setUsers((current) => [
              ...current,
              {
                id: selectedUserId,
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                status: 'active',
              },
            ]);
          }

          createdUserId = null;
          setNotice(
            formMode === 'new'
              ? 'New account and team membership created successfully.'
              : 'Team member added successfully.',
          );
        } catch (membershipError) {
          // Avoid leaving an orphan account if membership creation fails.
          if (createdUserId) {
            try {
              await axios.delete(
                `${API_URL}/users/${encodeURIComponent(createdUserId)}`,
              );
            } catch (rollbackError) {
              console.error(
                'Could not roll back the newly created user:',
                rollbackError,
              );
            }
          }

          throw membershipError;
        }
      }

      setModalOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
    } catch (err) {
      console.error('Failed to save team member:', err);

      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data;
        const serverMessage =
          typeof responseData === 'object' &&
          responseData !== null &&
          'message' in responseData
            ? String(responseData.message)
            : '';

        setError(
          serverMessage ||
            `Could not save the team member${
              err.response?.status
                ? ` (HTTP ${err.response.status})`
                : ''
            }. Check that JSON Server is running on port 5000.`,
        );
      } else {
        setError('An unexpected error occurred while saving the member.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member: TeamMember) {
    if (member.role === 'owner') {
      setError('Owner membership cannot be removed from this page.');
      return;
    }

    if (
      !window.confirm(
        `Remove ${member.name} from this workspace? Their user account will not be deleted.`,
      )
    ) {
      return;
    }

    setError('');
    setNotice('');

    try {
      await axios.delete(
        `${API_URL}/workspaceMembers/${encodeURIComponent(member.id)}`,
      );

      setMembers((current) =>
        current.filter(
          (item) => String(item.id) !== String(member.id),
        ),
      );

      setNotice(`${member.name} was removed from the workspace.`);
    } catch (err) {
      console.error('Failed to remove team member:', err);
      setError('Could not remove this team member.');
    }
  }

  async function toggleStatus(member: TeamMember) {
    if (member.role === 'owner') {
      setError('Owner status cannot be changed from this page.');
      return;
    }

    const nextStatus: MemberStatus =
      member.status === 'active' ? 'inactive' : 'active';

    setError('');
    setNotice('');

    try {
      const response = await axios.patch<WorkspaceMember>(
        `${API_URL}/workspaceMembers/${encodeURIComponent(member.id)}`,
        { status: nextStatus },
      );

      setMembers((current) =>
        current.map((item) =>
          String(item.id) === String(member.id)
            ? { ...item, ...response.data }
            : item,
        ),
      );

      setNotice(`${member.name} is now ${nextStatus}.`);
    } catch (err) {
      console.error('Failed to update member status:', err);
      setError('Could not update member status.');
    }
  }

  return (
    <DashboardLayout>
      <main className="min-h-full space-y-6 bg-[#faf7f3] text-[#542f1e] dark:bg-[#0b0d0f] dark:text-slate-100">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-[#8b7668] dark:text-slate-400">
              Manage access to your workspace
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Users size={28} />
              Team Management
            </h1>
            <p className="mt-2 text-sm text-[#8b7668] dark:text-slate-400">
              Manage team members, workspace roles, and membership status.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
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
              Add Member
            </button>
          </div>
        </header>

        {error && !modalOpen && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            <span className="flex items-start gap-2">
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <span className="flex items-center gap-2">
              <Check size={17} />
              {notice}
            </span>
            <button
              type="button"
              onClick={() => setNotice('')}
              aria-label="Dismiss notice"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Members"
            value={members.length}
            icon={<Users size={21} />}
          />
          <StatCard
            label="Active Members"
            value={
              members.filter((member) => member.status === 'active').length
            }
            icon={<UserRound size={21} />}
          />
          <StatCard
            label="Administrators"
            value={
              members.filter(
                (member) =>
                  member.role === 'admin' || member.role === 'owner',
              ).length
            }
            icon={<ShieldCheck size={21} />}
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
                placeholder="Search name or email..."
                className={`${inputClass} pl-10`}
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className={inputClass}
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#eadfd5] bg-white p-12 text-sm dark:border-white/10 dark:bg-[#151a1c]">
              <LoaderCircle size={20} className="animate-spin" />
              Loading team members...
            </div>
          ) : visibleMembers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9c7b8] bg-white px-5 py-12 text-center dark:border-white/15 dark:bg-[#151a1c]">
              <Users
                size={38}
                className="mx-auto text-[#8b7668] dark:text-slate-400"
              />
              <h2 className="mt-4 text-lg font-semibold">
                {search || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No matching team members'
                  : 'No team members yet'}
              </h2>
              <p className="mt-2 text-sm text-[#8b7668] dark:text-slate-400">
                {availableUsers.length > 0
                  ? 'Add an existing user or create a new member.'
                  : 'All existing users are already members. You can create a new member.'}
              </p>
              {!search &&
                roleFilter === 'all' &&
                statusFilter === 'all' && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#e5f55b] dark:text-[#171a10]"
                  >
                    <Plus size={16} />
                    Add first member
                  </button>
                )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#eadfd5] bg-white dark:border-white/10 dark:bg-[#151a1c]">
              <div className="flex items-center justify-between border-b border-[#eadfd5] px-5 py-4 dark:border-white/10">
                <h2 className="font-semibold">Workspace Members</h2>
                <span className="text-sm text-[#8b7668] dark:text-slate-400">
                  {visibleMembers.length} member
                  {visibleMembers.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#faf7f3] text-xs uppercase tracking-wide text-[#8b7668] dark:bg-white/[0.03] dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Member</th>
                      <th className="px-5 py-4 font-semibold">Role</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eadfd5] dark:divide-white/10">
                    {visibleMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="transition hover:bg-[#faf7f3]/70 dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5eee8] font-bold text-[#7c452a] dark:bg-white/10 dark:text-[#e5f55b]">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold">{member.name}</p>
                              <p className="mt-1 flex items-center gap-1.5 break-all text-xs text-[#8b7668] dark:text-slate-400">
                                <Mail size={13} />
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[member.role] || roleStyles.customer}`}
                          >
                            {roleOptions.find(
                              (role) => role.value === member.role,
                            )?.label || member.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={member.role === 'owner'}
                            onClick={() => void toggleStatus(member)}
                            title={
                              member.role === 'owner'
                                ? 'Owner status cannot be changed here'
                                : 'Toggle membership status'
                            }
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              member.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                            } disabled:cursor-not-allowed`}
                          >
                            {member.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(member)}
                              aria-label={`Edit ${member.name}`}
                              className="rounded-lg p-2 text-[#8b7668] hover:bg-[#faf7f3] dark:hover:bg-white/5"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={member.role === 'owner'}
                              onClick={() => void handleDelete(member)}
                              aria-label={`Remove ${member.name}`}
                              title={
                                member.role === 'owner'
                                  ? 'Owner membership cannot be removed here'
                                  : 'Remove member'
                              }
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {modalOpen && (
        <div
  className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 backdrop-blur-sm sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                setModalOpen(false);
              }
            }}
          >
           <div
  role="dialog"
  aria-modal="true"
  aria-labelledby="team-modal-title"
  className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-[#eadfd5] bg-white p-4 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-white/10 dark:bg-[#151a1c] sm:p-6"
>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 id="team-modal-title" className="text-xl font-bold">
                    {editingId ? 'Edit Team Member' : 'Add Team Member'}
                  </h2>
                  <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">
                    Assign a user to your workspace and choose their role.
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

              {!editingId && (
                <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[#f5eee8] p-1 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode('existing');
                      setForm((current) => ({
                        ...current,
                        userId: availableUsers[0]?.id || '',
                      }));
                      setError('');
                    }}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                      formMode === 'existing'
                        ? 'bg-white text-[#542f1e] shadow-sm dark:bg-[#252a2c] dark:text-white'
                        : 'text-[#8b7668] dark:text-slate-400'
                    }`}
                  >
                    Existing User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode('new');
                      setForm((current) => ({
                        ...current,
                        userId: '',
                      }));
                      setError('');
                    }}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                      formMode === 'new'
                        ? 'bg-white text-[#542f1e] shadow-sm dark:bg-[#252a2c] dark:text-white'
                        : 'text-[#8b7668] dark:text-slate-400'
                    }`}
                  >
                    Create New Member
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {formMode === 'existing' && !editingId ? (
                  <div>
                    <label
                      htmlFor="team-user"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Existing user *
                    </label>
                    <select
                      id="team-user"
                      required
                      value={form.userId}
                      onChange={(event) =>
                        setForm({ ...form, userId: event.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="">Select a user</option>
                      {availableUsers.map((record) => (
                        <option key={record.id} value={record.id}>
                          {record.name} ({record.email})
                        </option>
                      ))}
                    </select>
                    {availableUsers.length === 0 && (
                      <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                        All existing users already belong to this workspace.
                        Choose Create New Member instead.
                      </p>
                    )}
                  </div>
                ) : formMode === 'new' && !editingId ? (
                  <>
                    <div>
                      <label
                        htmlFor="new-member-name"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Full name *
                      </label>
                      <input
                        id="new-member-name"
                        required
                        minLength={2}
                        maxLength={80}
                        value={form.name}
                        onChange={(event) =>
                          setForm({ ...form, name: event.target.value })
                        }
                        placeholder="Enter full name"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-member-email"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Email address *
                      </label>
                      <input
                        id="new-member-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(event) =>
                          setForm({ ...form, email: event.target.value })
                        }
                        placeholder="member@example.com"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-member-password"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Initial password *
                      </label>
                      <input
                        id="new-member-password"
                        type="password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) =>
                          setForm({ ...form, password: event.target.value })
                        }
                        placeholder="At least 6 characters"
                        className={inputClass}
                      />
                      <p className="mt-1.5 text-xs text-[#8b7668] dark:text-slate-400">
                        Demo only: this project stores passwords in JSON Server.
                        Do not use real passwords.
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-sm text-[#8b7668] dark:text-slate-400">
                      Editing{' '}
                      {members.find(
                        (member) => String(member.id) === String(editingId),
                      )?.name || 'team member'}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="team-role"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Workspace role *
                  </label>
                  <select
                    id="team-role"
                    value={form.role}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role: event.target.value as Role,
                      })
                    }
                    className={inputClass}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="team-status"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Membership status *
                  </label>
                  <select
                    id="team-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as MemberStatus,
                      })
                    }
                    className={inputClass}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <CircleAlert size={17} className="mt-0.5 shrink-0" />
                    {error}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
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
                    disabled={
                      saving ||
                      (!editingId &&
                        formMode === 'existing' &&
                        availableUsers.length === 0)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#65371f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e5f55b] dark:text-[#171a10]"
                  >
                    {saving ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Save Changes'
                        : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfd5] bg-white p-5 dark:border-white/10 dark:bg-[#151a1c]">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8b7668] dark:text-slate-400">
          {label}
        </p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}
