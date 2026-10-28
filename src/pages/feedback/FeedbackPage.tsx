import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Edit2,
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
  Trash2,
  X,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import ModalOverlay from '../../components/common/ModalOverlay';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type FeedbackStatus = 'Under Review' | 'Planned' | 'In Progress' | 'Completed' | 'Rejected';
type Priority = 'Low' | 'Medium' | 'High';

interface Feedback {
  id: string;
  workspaceId?: string;
  title: string;
  description: string;
  categoryId: string;
  status: FeedbackStatus;
  priority: Priority;
  submitterId: string;
  submitter: string;
  createdAt: string;
  updatedAt?: string;
}

interface Category {
  id: string;
  workspaceId?: string;
  name: string;
  color?: string;
}

interface Vote {
  id: string;
  workspaceId?: string;
  feedbackId: string;
  userId: string;
}

interface Comment {
  id: string;
  workspaceId?: string;
  feedbackId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

const statuses: FeedbackStatus[] = [
  'Under Review',
  'Planned',
  'In Progress',
  'Completed',
  'Rejected',
];

const priorities: Priority[] = ['Low', 'Medium', 'High'];

const emptyForm = {
  title: '',
  description: '',
  categoryId: '',
  status: 'Under Review' as FeedbackStatus,
  priority: 'Medium' as Priority,
};

function statusStyle(status: string) {
  const styles: Record<string, string> = {
    'Under Review': 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300',
    Planned: 'bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300',
    'In Progress': 'bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-300',
    Completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300',
  };

  return styles[status] || 'bg-slate-100 text-slate-700';
}

function formatFeedbackDate(date?: string) {
  if (!date) return 'Recently';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return 'Recently';

  return parsed.toLocaleDateString();
}

export default function FeedbackPage() {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<Feedback[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feedback | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  const workspaceId = user?.workspaceId;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [feedbackRes, categoryRes, voteRes, commentRes] = await Promise.all([
        axios.get<Feedback[]>(`${API}/feedback`),
        axios.get<Category[]>(`${API}/categories`),
        axios.get<Vote[]>(`${API}/votes`),
        axios.get<Comment[]>(`${API}/comments`),
      ]);

      const inWorkspace = <T extends { workspaceId?: string }>(record: T) =>
  !workspaceId || !record.workspaceId || record.workspaceId === workspaceId;

setItems(feedbackRes.data.filter(inWorkspace));
setCategories(categoryRes.data.filter(inWorkspace));
setVotes(voteRes.data.filter(inWorkspace));
setComments(commentRes.data.filter(inWorkspace));
    } catch {
      setError('Unable to load feedback. Check that JSON Server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const selectedFeedback = items.find((item) => String(item.id) === feedbackId);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items
      .filter((item) => {
        const category = categories.find((cat) => String(cat.id) === String(item.categoryId));
        const matchesSearch =
          !query ||
          item.title.toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query);

        return (
          matchesSearch &&
          (statusFilter === 'all' || item.status === statusFilter) &&
          (categoryFilter === 'all' || String(item.categoryId) === categoryFilter) &&
          (priorityFilter === 'all' || item.priority === priorityFilter) &&
          (!categoryFilter || categoryFilter === 'all' || Boolean(category))
        );
      })
      .sort((a, b) => {
        if (sort === 'oldest') return Date.parse(a.createdAt) - Date.parse(b.createdAt);
        if (sort === 'votes') {
          const countA = votes.filter((vote) => String(vote.feedbackId) === String(a.id)).length;
          const countB = votes.filter((vote) => String(vote.feedbackId) === String(b.id)).length;
          return countB - countA;
        }
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
  }, [items, categories, votes, search, statusFilter, categoryFilter, priorityFilter, sort]);

const openCreate = () => {
  setError('');
  setEditing(null);
  setForm({
    ...emptyForm,
    categoryId: categories[0] ? String(categories[0].id) : '',
  });
  setModalOpen(true);
};

  const openEdit = (item: Feedback) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || '',
      categoryId: item.categoryId || '',
      status: item.status || 'Under Review',
      priority: item.priority || 'Medium',
    });
    setModalOpen(true);
  };

  const saveFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    if (form.title.trim().length < 3) {
      setError('The title must contain at least 3 characters.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        workspaceId: editing?.workspaceId || workspaceId,
        submitterId: editing?.submitterId || user.id,
        submitter: editing?.submitter || user.name,
        updatedAt: new Date().toISOString(),
      };

      if (editing) {
        const response = await axios.patch<Feedback>(
          `${API}/feedback/${editing.id}`,
          payload,
        );
        setItems((current) =>
          current.map((item) => String(item.id) === String(editing.id) ? response.data : item),
        );
        setNotice('Feedback updated successfully.');
      } else {
        if (workspaceId) {
          const existing = items.filter((item) => item.workspaceId === workspaceId);
          if (existing.length >= 100) {
            setError('The demo Free plan limit of 100 feedback items has been reached.');
            setSaving(false);
            return;
          }
        }

        const response = await axios.post<Feedback>(`${API}/feedback`, {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        setItems((current) => [response.data, ...current]);
        setNotice('Feedback created successfully.');
      }

      setModalOpen(false);
      setEditing(null);
    } catch {
      setError('Could not save feedback. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteFeedback = async (item: Feedback) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;

    try {
      await axios.delete(`${API}/feedback/${item.id}`);

      const relatedVotes = votes.filter((vote) => String(vote.feedbackId) === String(item.id));
      const relatedComments = comments.filter((comment) => String(comment.feedbackId) === String(item.id));

      await Promise.all([
        ...relatedVotes.map((vote) => axios.delete(`${API}/votes/${vote.id}`)),
        ...relatedComments.map((comment) => axios.delete(`${API}/comments/${comment.id}`)),
      ]);

      setItems((current) => current.filter((entry) => String(entry.id) !== String(item.id)));
      setVotes((current) => current.filter((vote) => String(vote.feedbackId) !== String(item.id)));
      setComments((current) => current.filter((comment) => String(comment.feedbackId) !== String(item.id)));
      setNotice('Feedback deleted.');
      if (feedbackId === String(item.id)) navigate('/feedback');
    } catch {
      setError('Could not delete feedback and its related records.');
    }
  };

  const toggleVote = async (item: Feedback) => {
    if (!user) return;

    const existing = votes.find(
      (vote) => String(vote.feedbackId) === String(item.id) && vote.userId === user.id,
    );

    try {
      if (existing) {
        await axios.delete(`${API}/votes/${existing.id}`);
        setVotes((current) => current.filter((vote) => String(vote.id) !== String(existing.id)));
      } else {
        const response = await axios.post<Vote>(`${API}/votes`, {
          feedbackId: String(item.id),
          userId: user.id,
          workspaceId: item.workspaceId || workspaceId,
        });
        setVotes((current) => [...current, response.data]);
      }
    } catch {
      setError('Unable to update your vote.');
    }
  };

  const addComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !selectedFeedback || !commentText.trim()) return;

    setCommentSaving(true);
    try {
      const response = await axios.post<Comment>(`${API}/comments`, {
        feedbackId: String(selectedFeedback.id),
        userId: user.id,
        userName: user.name,
        message: commentText.trim(),
        createdAt: new Date().toISOString(),
        workspaceId: selectedFeedback.workspaceId || workspaceId,
      });

      setComments((current) => [...current, response.data]);
      setCommentText('');
      setNotice('Comment added.');
    } catch {
      setError('Could not add comment.');
    } finally {
      setCommentSaving(false);
    }
  };

  if (loading) {
  return (
    <DashboardLayout
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-[#eadfd5] bg-white text-sm text-[#8b7668] dark:border-white/10 dark:bg-[#151a1c] dark:text-slate-400">
        <LoaderCircle size={20} className="animate-spin" />
        Loading feedback...
      </div>
    </DashboardLayout>
  );
}

 return (
  <DashboardLayout
    searchValue={search}
    onSearchChange={setSearch}
  >
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            {feedbackId && (
              <Link to="/feedback" className="mb-3 inline-flex items-center gap-2 text-sm text-[#8b7668] hover:underline dark:text-slate-400">
                <ArrowLeft size={16} /> All feedback
              </Link>
            )}
            <h1 className="text-2xl font-bold sm:text-3xl">
              {feedbackId ? 'Feedback details' : 'Feedback Management'}
            </h1>
            <p className="mt-2 text-sm text-[#8b7668] dark:text-slate-400">
              Collect, prioritize and track customer ideas.
            </p>
          </div>

          {!feedbackId && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#65371f] dark:bg-[#e5f55b] dark:text-[#171a10]"
            >
              <Plus size={18} /> Add feedback
            </button>
          )}
        </div>

        {notice && (
          <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
            {notice}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button>
          </div>
        )}

        {feedbackId ? (
          !selectedFeedback ? (
            <section className="rounded-2xl border border-[#eadfd5] bg-white p-8 dark:border-white/10 dark:bg-[#151a1c]">
              <h2 className="font-semibold">Feedback not found</h2>
              <p className="mt-2 text-sm text-[#8b7668]">This feedback may have been deleted or belongs to another workspace.</p>
            </section>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-[#eadfd5] bg-white p-5 dark:border-white/10 dark:bg-[#151a1c] sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h2 className="text-xl font-bold">{selectedFeedback.title}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedFeedback.status)}`}>
                    {selectedFeedback.status}
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#755a49] dark:text-slate-300">
                  {selectedFeedback.description || 'No description provided.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-800 dark:bg-orange-400/10 dark:text-orange-300">
                    {selectedFeedback.priority} priority
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                    {categories.find((cat) => String(cat.id) === String(selectedFeedback.categoryId))?.name || 'Uncategorized'}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button onClick={() => void toggleVote(selectedFeedback)} className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd5] px-4 py-2 text-sm font-semibold hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5">
                    <ThumbsUp size={16} />
                    {votes.some((vote) => String(vote.feedbackId) === String(selectedFeedback.id) && vote.userId === user?.id) ? 'Remove vote' : 'Vote'}
                    ({votes.filter((vote) => String(vote.feedbackId) === String(selectedFeedback.id)).length})
                  </button>
                  <button onClick={() => openEdit(selectedFeedback)} className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd5] px-4 py-2 text-sm font-semibold hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5">
                    <Edit2 size={16} /> Edit
                  </button>
                  <button onClick={() => void deleteFeedback(selectedFeedback)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-400/10">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-[#eadfd5] bg-white p-5 dark:border-white/10 dark:bg-[#151a1c]">
                <h2 className="flex items-center gap-2 font-semibold">
                  <MessageSquare size={18} /> Comments ({comments.filter((comment) => String(comment.feedbackId) === String(selectedFeedback.id)).length})
                </h2>
                <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto">
                  {comments.filter((comment) => String(comment.feedbackId) === String(selectedFeedback.id)).map((comment) => (
                    <article key={comment.id} className="rounded-xl bg-[#faf7f3] p-3 dark:bg-white/[0.04]">
                      <p className="text-sm font-semibold">{comment.userName}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#755a49] dark:text-slate-300">{comment.message}</p>
                      <p className="mt-2 text-xs text-[#8b7668]">{new Date(comment.createdAt).toLocaleString()}</p>
                    </article>
                  ))}
                  {!comments.some((comment) => String(comment.feedbackId) === String(selectedFeedback.id)) && (
                    <p className="py-6 text-center text-sm text-[#8b7668]">No comments yet.</p>
                  )}
                </div>
                <form onSubmit={addComment} className="mt-4 space-y-3">
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    maxLength={1000}
                    required
                    rows={3}
                    placeholder="Write a comment…"
                    className="w-full rounded-xl border border-[#eadfd5] bg-white p-3 text-sm outline-none focus:border-[#b87a51] dark:border-white/10 dark:bg-[#0b0d0f]"
                  />
                  <button disabled={commentSaving} className="w-full rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#e5f55b] dark:text-[#171a10]">
                    {commentSaving ? 'Posting…' : 'Post comment'}
                  </button>
                </form>
              </section>
            </div>
          )
        ) : (
          <>
            <section className="mb-5 grid gap-3 rounded-2xl border border-[#eadfd5] bg-white p-4 dark:border-white/10 dark:bg-[#151a1c] md:grid-cols-2 xl:grid-cols-5">
              <label className="relative xl:col-span-2">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7668]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feedback…" className="w-full rounded-xl border border-[#eadfd5] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#b87a51] dark:border-white/10 dark:bg-[#0b0d0f]" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-[#eadfd5] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">
                <option value="all">All statuses</option>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-[#eadfd5] bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">
                <option value="all">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <div className="flex gap-2">
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#eadfd5] bg-white px-2 py-2.5 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">
                  <option value="all">All priorities</option>
                  {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                </select>
                <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort feedback" className="min-w-0 flex-1 rounded-xl border border-[#eadfd5] bg-white px-2 py-2.5 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="votes">Most votes</option>
                </select>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#eadfd5] bg-white dark:border-white/10 dark:bg-[#151a1c]">
              <div className="flex items-center justify-between border-b border-[#eadfd5] px-5 py-4 dark:border-white/10">
                <h2 className="font-semibold">All feedback</h2>
                <span className="text-xs text-[#8b7668]">{visibleItems.length} result{visibleItems.length === 1 ? '' : 's'}</span>
              </div>

              {visibleItems.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <MessageSquare size={34} className="mx-auto text-[#b9a18e] dark:text-slate-600" />
                  <h3 className="mt-4 font-semibold">No feedback found</h3>
                  <p className="mt-2 text-sm text-[#8b7668]">Try adjusting your filters or add a new request.</p>
                  <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#e5f55b] dark:text-[#171a10]">
                    <Plus size={16} /> Add feedback
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#eadfd5] dark:divide-white/10">
                  {visibleItems.map((item) => {
                    const category = categories.find((cat) => String(cat.id) === String(item.categoryId));
                    const itemVotes = votes.filter((vote) => String(vote.feedbackId) === String(item.id));
                    const voted = itemVotes.some((vote) => vote.userId === user?.id);

                    return (
                      <article key={item.id} className="flex flex-col gap-4 p-5 transition hover:bg-[#faf7f3] dark:hover:bg-white/[0.025] sm:flex-row sm:items-start">
                        <button onClick={() => void toggleVote(item)} title={voted ? 'Remove vote' : 'Vote for this idea'} className={`flex shrink-0 items-center gap-2 self-start rounded-xl border px-3 py-2 text-sm font-semibold ${voted ? 'border-[#b87950] bg-orange-50 text-[#7c452a] dark:border-[#e5f55b]/40 dark:bg-[#e5f55b]/10 dark:text-[#e5f55b]' : 'border-[#eadfd5] text-[#755a49] dark:border-white/10 dark:text-slate-300'}`}>
                          <ThumbsUp size={16} /> {itemVotes.length}
                        </button>

                        <div className="min-w-0 flex-1">
                          <Link to={`/feedback/${item.id}`} className="break-words font-semibold hover:text-[#9b5d35] hover:underline dark:hover:text-[#e5f55b]">
                            {item.title}
                          </Link>
                          <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#755a49] dark:text-slate-400">
                            {item.description || 'No description provided.'}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className={`rounded-full px-2.5 py-1 font-medium ${statusStyle(item.status)}`}>{item.status}</span>
                            <span className="rounded-full bg-[#f5eee8] px-2.5 py-1 text-[#755a49] dark:bg-white/5 dark:text-slate-300">{category?.name || 'Uncategorized'}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-white/5 dark:text-slate-300">{item.priority || 'Medium'} priority</span>
                            <span className="text-[#8b7668]">{item.submitter || 'Unknown'} · {formatFeedbackDate(item.createdAt)}</span>
                          </div>
                          <Link to={`/feedback/${item.id}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7c452a] hover:underline dark:text-[#e5f55b]">
                            <MessageSquare size={14} />
                            {comments.filter((comment) => String(comment.feedbackId) === String(item.id)).length} comments · View details
                          </Link>
                        </div>

                        <div className="flex shrink-0 gap-2 sm:flex-col">
                          <button onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="rounded-lg border border-[#eadfd5] p-2.5 hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5"><Edit2 size={16} /></button>
                          <button onClick={() => void deleteFeedback(item)} aria-label={`Delete ${item.title}`} className="rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-400/10"><Trash2 size={16} /></button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <ModalOverlay
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        className="max-w-xl border border-[#eadfd5] dark:border-white/10"
      >
          <section role="dialog" aria-modal="true" aria-labelledby="feedback-form-title" className="p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="feedback-form-title" className="text-xl font-bold">{editing ? 'Edit feedback' : 'Create feedback'}</h2>
              <button onClick={() => setModalOpen(false)} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 hover:bg-[#f5eee8] disabled:opacity-50 dark:hover:bg-white/5"><X size={18} /></button>
            </div>

            <form onSubmit={saveFeedback} className="space-y-4">
              <label className="block text-sm font-medium">
                Title <span className="text-red-500">*</span>
                <input required minLength={3} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What would you like us to improve?" className="mt-2 w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm outline-none focus:border-[#b87a51] dark:border-white/10 dark:bg-[#0b0d0f]" />
              </label>

              <label className="block text-sm font-medium">
                Description
                <textarea maxLength={3000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Explain the problem or idea…" className="mt-2 w-full resize-y rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm outline-none focus:border-[#b87a51] dark:border-white/10 dark:bg-[#0b0d0f]" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Category
                  <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="mt-2 w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">
                    <option value="">Uncategorized</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium">
                  Priority
                  <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })} className="mt-2 w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">
                    {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium">
                Status
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as FeedbackStatus })} className="mt-2 w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-[#0b0d0f]">
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-[#eadfd5] pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
                <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="rounded-xl border border-[#eadfd5] px-4 py-2.5 text-sm font-semibold hover:bg-[#faf7f3] disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#65371f] disabled:opacity-60 dark:bg-[#e5f55b] dark:text-[#171a10]">
                  {saving && <LoaderCircle size={16} className="animate-spin" />}
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create feedback'}
                </button>
              </div>
                 </form>
          </section>
      </ModalOverlay>
  </DashboardLayout>
);
}
  
