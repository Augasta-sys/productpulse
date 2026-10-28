import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  Check,
  CircleAlert,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
  Folder,
  Hash,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import ModalOverlay from '../../components/common/ModalOverlay';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const COLORS = [
  '#7c452a',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#059669',
  '#d97706',
  '#0891b2',
  '#64748b',
];

type Category = {
  id: string;
  workspaceId?: string;
  name: string;
  color: string;
};

type TagItem = {
  id: string;
  workspaceId?: string;
  name: string;
  color?: string;
  categoryId?: string;
};

type Tab = 'categories' | 'tags';
type FormMode = 'create' | 'edit';

const EMPTY_FORM = {
  name: '',
  color: COLORS[0],
  categoryId: '',
};

export default function CategoriesPage() {
  const { user } = useAuth();
  const workspaceId = String(user?.workspaceId || 'workspace-1');

  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagsList, setTagsList] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [categoryResponse, tagResponse] = await Promise.all([
        axios.get<Category[]>(`${API_URL}/categories`),
        axios.get<TagItem[]>(`${API_URL}/tags`),
      ]);

      const belongsToWorkspace = (
        item: { workspaceId?: string },
      ) =>
        !item.workspaceId ||
        String(item.workspaceId) === workspaceId;

      setCategories(categoryResponse.data.filter(belongsToWorkspace));
      setTagsList(tagResponse.data.filter(belongsToWorkspace));
    } catch {
      setError(
        'Unable to load categories and tags. Make sure JSON Server is running on port 5000 and that db.json contains categories and tags arrays.',
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) =>
      category.name.toLowerCase().includes(query),
    );
  }, [categories, search]);

  const visibleTags = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tagsList.filter((tag) =>
      tag.name.toLowerCase().includes(query),
    );
  }, [tagsList, search]);

  function openCreate() {
    setMode('create');
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setModalOpen(true);
  }

  function openEditCategory(category: Category) {
    setMode('edit');
    setEditingId(category.id);
    setForm({
      name: category.name,
      color: category.color || COLORS[0],
      categoryId: '',
    });
    setError('');
    setModalOpen(true);
  }

  function openEditTag(tag: TagItem) {
    setMode('edit');
    setEditingId(tag.id);
    setForm({
      name: tag.name,
      color: tag.color || COLORS[0],
      categoryId: tag.categoryId || '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError('Please enter a name.');
      return;
    }

    const currentItems =
      activeTab === 'categories' ? categories : tagsList;

    const duplicate = currentItems.some(
      (item) =>
        item.name.trim().toLowerCase() === name.toLowerCase() &&
        String(item.id) !== String(editingId),
    );

    if (duplicate) {
      setError(`A ${activeTab === 'categories' ? 'category' : 'tag'} with this name already exists.`);
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      if (activeTab === 'categories') {
        const payload = {
          name,
          color: form.color,
          workspaceId,
        };

        if (mode === 'edit' && editingId) {
          const response = await axios.patch<Category>(
            `${API_URL}/categories/${editingId}`,
            payload,
          );

          setCategories((current) =>
            current.map((item) =>
              String(item.id) === String(editingId)
                ? response.data
                : item,
            ),
          );
          setNotice('Category updated successfully.');
        } else {
          const response = await axios.post<Category>(
            `${API_URL}/categories`,
            {
              ...payload,
              id: `category-${Date.now()}`,
            },
          );

          setCategories((current) => [...current, response.data]);
          setNotice('Category created successfully.');
        }
      } else {
        const payload = {
          name,
          color: form.color,
          workspaceId,
          ...(form.categoryId
            ? { categoryId: form.categoryId }
            : {}),
        };

        if (mode === 'edit' && editingId) {
          const response = await axios.patch<TagItem>(
            `${API_URL}/tags/${editingId}`,
            payload,
          );

          setTagsList((current) =>
            current.map((item) =>
              String(item.id) === String(editingId)
                ? response.data
                : item,
            ),
          );
          setNotice('Tag updated successfully.');
        } else {
          const response = await axios.post<TagItem>(
            `${API_URL}/tags`,
            {
              ...payload,
              id: `tag-${Date.now()}`,
            },
          );

          setTagsList((current) => [...current, response.data]);
          setNotice('Tag created successfully.');
        }
      }

      setModalOpen(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
    } catch {
      setError('Could not save your changes. Please check JSON Server and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    const linkedTags = tagsList.filter(
      (tag) => String(tag.categoryId) === String(category.id),
    );

    const message = linkedTags.length
      ? `Delete "${category.name}"? It has ${linkedTags.length} linked tag(s).`
      : `Delete category "${category.name}"?`;

    if (!window.confirm(message)) return;

    setError('');
    setNotice('');

    try {
      await axios.delete(
        `${API_URL}/categories/${category.id}`,
      );

      setCategories((current) =>
        current.filter(
          (item) => String(item.id) !== String(category.id),
        ),
      );

      setNotice('Category deleted successfully.');
    } catch {
      setError('Could not delete the category.');
    }
  }

  async function handleDeleteTag(tag: TagItem) {
    if (!window.confirm(`Delete tag "${tag.name}"?`)) return;

    setError('');
    setNotice('');

    try {
      await axios.delete(`${API_URL}/tags/${tag.id}`);

      setTagsList((current) =>
        current.filter((item) => String(item.id) !== String(tag.id)),
      );

      setNotice('Tag deleted successfully.');
    } catch {
      setError('Could not delete the tag.');
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm text-[#542f1e] outline-none transition focus:border-[#7c452a] focus:ring-2 focus:ring-[#7c452a]/10 dark:border-white/10 dark:bg-[#0b0d0f] dark:text-slate-100 dark:focus:border-[#e5f55b]';

  return (
    <DashboardLayout>
      <main className="min-h-full space-y-6 bg-[#faf7f3] text-[#542f1e] dark:bg-[#0b0d0f] dark:text-slate-100">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-[#8b7668] dark:text-slate-400">
              Organize your product feedback
            </p>

            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Tags size={28} />
              Categories & Tags
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#8b7668] dark:text-slate-400">
              Group feedback into categories and use tags to make it
              easier to organize and discover ideas.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#eadfd5] bg-white px-3 py-3 text-sm font-semibold hover:bg-[#f5eee8] disabled:opacity-50 dark:border-white/10 dark:bg-[#151a1c] dark:hover:bg-white/5"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#65371f] dark:bg-[#e5f55b] dark:text-[#171a10] dark:hover:bg-[#d5e64d]"
            >
              <Plus size={18} />
              Add {activeTab === 'categories' ? 'Category' : 'Tag'}
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
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              setSearch('');
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              activeTab === 'categories'
                ? 'border-[#7c452a] bg-white shadow-sm ring-1 ring-[#7c452a]/10 dark:border-[#e5f55b] dark:bg-[#151a1c] dark:ring-[#e5f55b]/10'
                : 'border-[#eadfd5] bg-white/60 hover:bg-white dark:border-white/10 dark:bg-[#151a1c]/60 dark:hover:bg-[#151a1c]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">
                <Folder size={22} />
              </span>
              <span className="text-3xl font-bold">{categories.length}</span>
            </div>
            <h2 className="mt-4 font-semibold">Categories</h2>
            <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">
              Organize feedback by topic or feature.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tags');
              setSearch('');
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              activeTab === 'tags'
                ? 'border-[#7c452a] bg-white shadow-sm ring-1 ring-[#7c452a]/10 dark:border-[#e5f55b] dark:bg-[#151a1c] dark:ring-[#e5f55b]/10'
                : 'border-[#eadfd5] bg-white/60 hover:bg-white dark:border-white/10 dark:bg-[#151a1c]/60 dark:hover:bg-[#151a1c]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                <Hash size={22} />
              </span>
              <span className="text-3xl font-bold">{tagsList.length}</span>
            </div>
            <h2 className="mt-4 font-semibold">Tags</h2>
            <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">
              Add labels to describe feedback more precisely.
            </p>
          </button>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 rounded-xl border border-[#eadfd5] bg-white p-1 dark:border-white/10 dark:bg-[#151a1c]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('categories');
                  setSearch('');
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'categories'
                    ? 'bg-[#7c452a] text-white dark:bg-[#e5f55b] dark:text-[#171a10]'
                    : 'text-[#8b7668] hover:bg-[#faf7f3] dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              >
                Categories
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('tags');
                  setSearch('');
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'tags'
                    ? 'bg-[#7c452a] text-white dark:bg-[#e5f55b] dark:text-[#171a10]'
                    : 'text-[#8b7668] hover:bg-[#faf7f3] dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              >
                Tags
              </button>
            </div>

            <label className="relative block w-full sm:max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7668] dark:text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${activeTab}...`}
                className={`${inputClass} pl-10`}
              />
            </label>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#eadfd5] bg-white p-12 text-sm dark:border-white/10 dark:bg-[#151a1c]">
              <LoaderCircle size={20} className="animate-spin" />
              Loading {activeTab}...
            </div>
          ) : activeTab === 'categories' ? (
            visibleCategories.length === 0 ? (
              <EmptyState
                title={search ? 'No matching categories' : 'No categories yet'}
                description={
                  search
                    ? 'Try another search term.'
                    : 'Create your first category to organize product feedback.'
                }
                onCreate={!search ? openCreate : undefined}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleCategories.map((category) => (
                  <article
                    key={category.id}
                    className="rounded-2xl border border-[#eadfd5] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#151a1c]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-11 w-11 shrink-0 rounded-xl"
                          style={{ backgroundColor: category.color || COLORS[0] }}
                        />
                        <div className="min-w-0">
                          <h3 className="break-words font-semibold">{category.name}</h3>
                          <p className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">
                            {tagsList.filter(
                              (tag) =>
                                String(tag.categoryId) === String(category.id),
                            ).length}{' '}
                            linked tags
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditCategory(category)}
                          aria-label={`Edit ${category.name}`}
                          className="rounded-lg p-2 text-[#8b7668] hover:bg-[#faf7f3] dark:hover:bg-white/5"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCategory(category)}
                          aria-label={`Delete ${category.name}`}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: category.color || COLORS[0] }}
                      />
                      <span className="text-xs text-[#8b7668] dark:text-slate-400">
                        {category.color || COLORS[0]}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : visibleTags.length === 0 ? (
            <EmptyState
              title={search ? 'No matching tags' : 'No tags yet'}
              description={
                search
                  ? 'Try another search term.'
                  : 'Create your first tag to label feedback.'
              }
              onCreate={!search ? openCreate : undefined}
            />
          ) : (
            <div className="rounded-2xl border border-[#eadfd5] bg-white p-4 dark:border-white/10 dark:bg-[#151a1c] sm:p-6">
              <div className="flex flex-wrap gap-3">
                {visibleTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex max-w-full items-center gap-2 rounded-xl border border-[#eadfd5] bg-[#faf7f3] py-2 pl-3 pr-2 dark:border-white/10 dark:bg-[#0b0d0f]"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color || COLORS[0] }}
                    />
                    <span className="max-w-[180px] break-words text-sm font-medium">
                      {tag.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditTag(tag)}
                      aria-label={`Edit ${tag.name}`}
                      className="rounded-md p-1.5 text-[#8b7668] hover:bg-white dark:hover:bg-white/10"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTag(tag)}
                      aria-label={`Delete ${tag.name}`}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <ModalOverlay
          open={modalOpen}
          onClose={() => {
            if (!saving) setModalOpen(false);
          }}
          className="max-w-lg border border-[#eadfd5] dark:border-white/10"
        >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-modal-title"
              className="p-5 sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 id="category-modal-title" className="text-xl font-bold">
                    {mode === 'edit' ? 'Edit' : 'Create'}{' '}
                    {activeTab === 'categories' ? 'Category' : 'Tag'}
                  </h2>
                  <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">
                    Choose a name and a color for easy identification.
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="item-name"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {activeTab === 'categories' ? 'Category' : 'Tag'} name *
                  </label>
                  <input
                    id="item-name"
                    required
                    maxLength={60}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder={
                      activeTab === 'categories'
                        ? 'e.g. User Experience'
                        : 'e.g. Feature Request'
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Choose color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm({ ...form, color })}
                        aria-label={`Choose color ${color}`}
                        aria-pressed={form.color === color}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                          form.color === color
                            ? 'ring-2 ring-[#542f1e] ring-offset-2 dark:ring-[#e5f55b] dark:ring-offset-[#151a1c]'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {form.color === color && (
                          <Check size={18} className="text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === 'tags' && categories.length > 0 && (
                  <div>
                    <label
                      htmlFor="tag-category"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Link to category (optional)
                    </label>
                    <select
                      id="tag-category"
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm({ ...form, categoryId: event.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="">No category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
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
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#65371f] disabled:opacity-60 dark:bg-[#e5f55b] dark:text-[#171a10]"
                  >
                    {saving ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {saving
                      ? 'Saving...'
                      : mode === 'edit'
                        ? 'Save Changes'
                        : 'Create'}
                  </button>
                </div>
              </form>
            </section>
        </ModalOverlay>
      </main>
    </DashboardLayout>
  );
}

function EmptyState({
  title,
  description,
  onCreate,
}: {
  title: string;
  description: string;
  onCreate?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d9c7b8] bg-white px-5 py-12 text-center dark:border-white/15 dark:bg-[#151a1c]">
      <Tags size={36} className="mx-auto text-[#8b7668] dark:text-slate-400" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#8b7668] dark:text-slate-400">
        {description}
      </p>
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#e5f55b] dark:text-[#171a10]"
        >
          <Plus size={16} />
          Create first item
        </button>
      )}
    </div>
  );
}
