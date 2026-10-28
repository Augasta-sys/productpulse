import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CreditCard,
  Crown,
  Download,
  FileText,
  Gauge,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type PlanInterval = 'monthly' | 'yearly';
type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'past_due' | string;

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price?: number;
  monthlyPrice?: number;
  yearlyPrice?: number;
  interval?: PlanInterval | string;
  features?: string[];
  limits?: {
    feedback?: number;
    members?: number;
    workspaces?: number;
  };
  isPopular?: boolean;
}

interface WorkspaceSubscription {
  id: string;
  workspaceId: string;
  planId?: string;
  plan?: string;
  status?: SubscriptionStatus;
  interval?: PlanInterval;
  startDate?: string;
  renewalDate?: string;
  currentPeriodEnd?: string;
  amount?: number;
  currency?: string;
}

interface UsageCounts {
  feedback: number;
  members: number;
  workspaces: number;
}

interface BillingRecord {
  id: string;
  workspaceId?: string;
  subscriptionId?: string;
  date?: string;
  amount?: number;
  currency?: string;
  status?: string;
  description?: string;
  invoiceNumber?: string;
}

const inputClass =
  'w-full rounded-xl border border-[#eadfd5] bg-white px-3 py-2.5 text-sm text-[#542f1e] outline-none transition focus:border-[#7c452a] focus:ring-2 focus:ring-[#7c452a]/10 dark:border-white/10 dark:bg-[#0b0d0f] dark:text-slate-100';

const fallbackPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For small teams getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ['Basic feedback collection', 'Roadmap and categories', 'Community support'],
    limits: { feedback: 100, members: 3, workspaces: 1 },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing product teams',
    monthlyPrice: 29,
    yearlyPrice: 290,
    isPopular: true,
    features: ['More feedback submissions', 'Unlimited categories and tags', 'Team collaboration', 'Priority support'],
    limits: { feedback: 2000, members: 15, workspaces: 3 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations at scale',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: ['High usage limits', 'Advanced team controls', 'Multiple workspaces', 'Dedicated support'],
    limits: { feedback: 10000, members: 100, workspaces: 20 },
  },
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const workspaceId = String(user?.workspaceId || '');

  const [plans, setPlans] = useState<SubscriptionPlan[]>(fallbackPlans);
  const [subscription, setSubscription] = useState<WorkspaceSubscription | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [usage, setUsage] = useState<UsageCounts>({ feedback: 0, members: 0, workspaces: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [modalError, setModalError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [interval, setInterval] = useState<PlanInterval>('monthly');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setPageError('');

    try {
      const [plansResult, subscriptionsResult, feedbackResult, membersResult, workspacesResult, billingResult] =
        await Promise.allSettled([
          axios.get<SubscriptionPlan[]>(`${API_URL}/subscriptionPlans`),
          axios.get<WorkspaceSubscription[]>(`${API_URL}/workspaceSubscriptions`),
          axios.get<unknown[]>(`${API_URL}/feedback`),
          axios.get<unknown[]>(`${API_URL}/workspaceMembers`),
          axios.get<unknown[]>(`${API_URL}/workspaces`),
          axios.get<BillingRecord[]>(`${API_URL}/billingHistory`),
        ]);

      if (plansResult.status === 'fulfilled' && plansResult.value.data.length) {
        setPlans(plansResult.value.data.map((plan) => normalizePlan(plan)));
      } else {
        setPlans(fallbackPlans);
      }

      if (subscriptionsResult.status === 'fulfilled') {
        const matching = subscriptionsResult.value.data.find(
          (item) => String(item.workspaceId) === workspaceId,
        );
        setSubscription(matching || null);
      }

      const countForWorkspace = (items: unknown[]) => {
        const list = items as Array<Record<string, unknown>>;
        return list.filter((item) => {
          const itemWorkspace = item.workspaceId;
          return itemWorkspace == null || String(itemWorkspace) === workspaceId;
        }).length;
      };

      setUsage((current) => ({
        feedback: feedbackResult.status === 'fulfilled' ? countForWorkspace(feedbackResult.value.data) : current.feedback,
        members: membersResult.status === 'fulfilled' ? countForWorkspace(membersResult.value.data) : current.members,
        workspaces: workspacesResult.status === 'fulfilled'
          ? (workspacesResult.value.data as Array<Record<string, unknown>>).filter(
              (item) => item.id != null && String(item.id) === workspaceId,
            ).length || current.workspaces
          : current.workspaces,
      }));

      if (billingResult.status === 'fulfilled') {
        const records = billingResult.value.data.filter(
          (item) => !item.workspaceId || String(item.workspaceId) === workspaceId,
        );
        setBillingRecords(records.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime()));
      } else {
        setBillingRecords([]);
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      setPageError('Unable to load subscription information. Check that JSON Server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setModalOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [modalOpen, saving]);

  const currentPlan = useMemo(() => {
    if (!subscription) return plans.find((plan) => plan.id === 'free') || plans[0];
    return plans.find((plan) => String(plan.id) === String(subscription.planId)) ||
      plans.find((plan) => plan.name.toLowerCase() === String(subscription.plan || '').toLowerCase()) ||
      plans.find((plan) => plan.id === 'free') ||
      plans[0];
  }, [plans, subscription]);

  const currentPrice = getPlanPrice(currentPlan, subscription?.interval || interval);
  const renewalDate = subscription?.renewalDate || subscription?.currentPeriodEnd;
  const status = subscription?.status || 'active';

  const openUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setInterval(subscription?.interval || 'monthly');
    setModalError('');
    setModalOpen(true);
  };

  async function handlePlanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;
    if (!workspaceId) {
      setModalError('Your account has no workspace assigned.');
      return;
    }

    setSaving(true);
    setModalError('');
    const now = new Date().toISOString();
    const nextSubscription: WorkspaceSubscription = {
      id: subscription?.id || `subscription-${workspaceId}`,
      workspaceId,
      planId: selectedPlan.id,
      plan: selectedPlan.name,
      interval,
      status: 'active',
      startDate: subscription?.startDate || now.slice(0, 10),
      renewalDate: nextRenewalDate(interval),
      amount: getPlanPrice(selectedPlan, interval),
      currency: subscription?.currency || 'USD',
    };

    try {
      if (subscription?.id) {
        const response = await axios.patch<WorkspaceSubscription>(
          `${API_URL}/workspaceSubscriptions/${encodeURIComponent(subscription.id)}`,
          nextSubscription,
        );
        setSubscription(response.data);
      } else {
        const response = await axios.post<WorkspaceSubscription>(
          `${API_URL}/workspaceSubscriptions`,
          nextSubscription,
        );
        setSubscription(response.data);
      }
      setNotice(`Your plan selection was saved as ${selectedPlan.name}. Connect a payment provider before accepting real payments.`);
      setModalOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Failed to save subscription:', error);
      setModalError('Could not save the plan. Check your JSON Server data and try again.');
    } finally {
      setSaving(false);
    }
  }

  const feedbackLimit = currentPlan?.limits?.feedback ?? 100;
  const memberLimit = currentPlan?.limits?.members ?? 3;
  const workspaceLimit = currentPlan?.limits?.workspaces ?? 1;

  return (
    <DashboardLayout>
      <main className="min-h-full space-y-6 bg-[#faf7f3] text-[#542f1e] dark:bg-[#0b0d0f] dark:text-slate-100">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-[#8b7668] dark:text-slate-400">Manage your plan, usage, and billing</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <CreditCard size={28} /> Subscription &amp; Usage
            </h1>
            <p className="mt-2 text-sm text-[#8b7668] dark:text-slate-400">
              Keep track of your workspace limits and subscription details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#eadfd5] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f5eee8] disabled:opacity-50 dark:border-white/10 dark:bg-[#151a1c] dark:hover:bg-white/5 sm:self-auto"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </header>

        {pageError && <Alert message={pageError} variant="error" onClose={() => setPageError('')} />}
        {notice && <Alert message={notice} variant="success" onClose={() => setNotice('')} />}

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c452a] via-[#8e5537] to-[#42271a] p-6 text-white shadow-lg sm:p-8">
            <div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full border-[28px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-20 right-24 h-52 w-52 rounded-full border-[24px] border-white/10" />
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                  <Crown size={15} /> CURRENT SUBSCRIPTION
                </div>
                <h2 className="mt-5 text-3xl font-bold">{currentPlan?.name || 'Free'} Plan</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/75">
                  {currentPlan?.description || 'Your current workspace subscription.'}
                </p>
                <div className="mt-6 flex flex-wrap items-end gap-2">
                  <span className="text-4xl font-bold">{formatMoney(currentPrice, subscription?.currency)}</span>
                  <span className="pb-1 text-sm text-white/75">/{subscription?.interval || 'month'}</span>
                </div>
              </div>
              <div className="min-w-36 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs text-white/70">Subscription status</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold capitalize">
                  <span className={`h-2 w-2 rounded-full ${status === 'active' ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                  {String(status).replace('_', ' ')}
                </p>
                <p className="mt-4 text-xs text-white/70">Next renewal</p>
                <p className="mt-1 text-sm font-semibold">{renewalDate ? formatDate(renewalDate) : 'Not scheduled'}</p>
              </div>
            </div>
            <div className="relative mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openUpgrade(plans.find((plan) => plan.id !== currentPlan?.id) || currentPlan!)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#65371f] transition hover:bg-[#f5eee8]"
              >
                Explore plans <ArrowUpRight size={16} />
              </button>
              <span className="self-center text-xs text-white/70">Plan changes are saved locally through JSON Server.</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eadfd5] bg-white p-6 dark:border-white/10 dark:bg-[#151a1c]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#8b7668] dark:text-slate-400">Billing overview</p>
                <h2 className="mt-1 text-lg font-bold">Payment details</h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">
                <CreditCard size={21} />
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <DetailRow label="Billing cycle" value={subscription?.interval || 'Monthly'} />
              <DetailRow label="Current plan price" value={formatMoney(currentPrice, subscription?.currency)} />
              <DetailRow label="Renewal date" value={renewalDate ? formatDate(renewalDate) : 'Not scheduled'} />
              <DetailRow label="Payment method" value="Not connected" />
            </div>
            <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
              This demo records plan selections only. No payment is collected.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold">Usage this period</h2>
              <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">Usage is estimated from the current JSON Server records.</p>
            </div>
            {loading && <span className="inline-flex items-center gap-2 text-sm text-[#8b7668]"><LoaderCircle size={16} className="animate-spin" /> Loading...</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <UsageCard title="Feedback submissions" icon={<FileText size={20} />} used={usage.feedback} limit={feedbackLimit} color="brown" />
            <UsageCard title="Team members" icon={<Users size={20} />} used={usage.members} limit={memberLimit} color="blue" />
            <UsageCard title="Workspaces" icon={<Gauge size={20} />} used={usage.workspaces} limit={workspaceLimit} color="violet" />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Choose a plan</h2>
            <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">Compare available plans for your team.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = String(plan.id) === String(currentPlan?.id);
              return (
                <article key={plan.id} className={`relative flex flex-col rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:bg-[#151a1c] sm:p-6 ${plan.isPopular ? 'border-[#7c452a] shadow-md shadow-[#7c452a]/10 dark:border-[#e5f55b]' : 'border-[#eadfd5] dark:border-white/10'}`}>
                  {plan.isPopular && <span className="absolute -top-3 left-5 rounded-full bg-[#7c452a] px-3 py-1 text-xs font-bold text-white dark:bg-[#e5f55b] dark:text-[#171a10]">MOST POPULAR</span>}
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">{plan.description || 'A plan for your workspace'}</p>
                    </div>
                    {isCurrent && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Current</span>}
                  </div>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-3xl font-bold">{formatMoney(getPlanPrice(plan, interval), subscription?.currency)}</span>
                    <span className="pb-1 text-sm text-[#8b7668] dark:text-slate-400">/{interval === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <ul className="mt-5 flex-1 space-y-3">
                    {(plan.features?.length ? plan.features : defaultFeatures(plan)).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-[#765b4a] dark:text-slate-300">
                        <Check size={17} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /> {feature}
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-sm text-[#765b4a] dark:text-slate-300">
                      <Check size={17} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {formatLimit(plan.limits?.feedback)} feedback submissions
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[#765b4a] dark:text-slate-300">
                      <Check size={17} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {formatLimit(plan.limits?.members)} team members
                    </li>
                  </ul>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => openUpgrade(plan)}
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-default disabled:opacity-60 ${plan.isPopular ? 'bg-[#7c452a] text-white hover:bg-[#65371f] dark:bg-[#e5f55b] dark:text-[#171a10]' : 'border border-[#eadfd5] hover:bg-[#f5eee8] dark:border-white/10 dark:hover:bg-white/5'}`}
                  >
                    {isCurrent ? 'Current plan' : <>Choose {plan.name} <ArrowUpRight size={16} /></>}
                  </button>
                </article>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-[#8b7668] dark:text-slate-400">Display prices:</span>
            <div className="inline-flex rounded-xl border border-[#eadfd5] bg-white p-1 dark:border-white/10 dark:bg-[#151a1c]">
              <button type="button" onClick={() => setInterval('monthly')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${interval === 'monthly' ? 'bg-[#7c452a] text-white dark:bg-[#e5f55b] dark:text-[#171a10]' : 'text-[#8b7668] dark:text-slate-400'}`}>Monthly</button>
              <button type="button" onClick={() => setInterval('yearly')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${interval === 'yearly' ? 'bg-[#7c452a] text-white dark:bg-[#e5f55b] dark:text-[#171a10]' : 'text-[#8b7668] dark:text-slate-400'}`}>Yearly</button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#eadfd5] bg-white dark:border-white/10 dark:bg-[#151a1c]">
          <div className="flex flex-col justify-between gap-3 border-b border-[#eadfd5] p-5 dark:border-white/10 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Billing history</h2>
              <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">Invoices and past subscription transactions.</p>
            </div>
            <span className="rounded-full bg-[#f5eee8] px-3 py-1.5 text-xs font-semibold text-[#7c452a] dark:bg-white/5 dark:text-slate-300">{billingRecords.length} records</span>
          </div>
          {billingRecords.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]"><FileText size={22} /></div>
              <h3 className="mt-3 font-semibold">No billing history yet</h3>
              <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">Completed invoices will appear here when billing is connected.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-[#faf7f3] text-xs uppercase tracking-wide text-[#8b7668] dark:bg-white/5 dark:text-slate-400">
                  <tr><th className="px-5 py-3 font-semibold">Invoice</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-[#eadfd5] dark:divide-white/10">
                  {billingRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-5 py-4"><div className="font-semibold">{record.invoiceNumber || record.id}</div><div className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">{record.description || 'Subscription'}</div></td>
                      <td className="px-5 py-4">{record.date ? formatDate(record.date) : '—'}</td>
                      <td className="px-5 py-4 font-semibold">{formatMoney(record.amount || 0, record.currency)}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${String(record.status).toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{record.status || 'Pending'}</span></td>
                      <td className="px-5 py-4"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#7c452a] hover:bg-[#f5eee8] dark:text-[#e5f55b] dark:hover:bg-white/5"><Download size={14} /> Print</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-400/20 dark:bg-violet-400/5 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-300" />
            <div><h3 className="font-semibold">Need a custom plan?</h3><p className="mt-1 text-sm text-[#765b4a] dark:text-slate-300">Contact your workspace administrator to discuss your subscription needs.</p></div>
          </div>
        </div>

        {modalOpen && selectedPlan && createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black/60 p-2 backdrop-blur-sm sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) setModalOpen(false);
            }}
          >
            <div role="dialog" aria-modal="true" aria-labelledby="plan-modal-title" className="w-full max-w-lg max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl border border-[#eadfd5] bg-white p-4 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-white/10 dark:bg-[#151a1c] sm:max-h-[calc(100dvh-2rem)] sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5eee8] px-2.5 py-1 text-xs font-semibold text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]"><Crown size={14} /> PLAN CHANGE</span>
                  <h2 id="plan-modal-title" className="mt-3 text-xl font-bold">Choose {selectedPlan.name}</h2>
                  <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">{selectedPlan.description || 'Update your workspace subscription.'}</p>
                </div>
                <button type="button" disabled={saving} onClick={() => setModalOpen(false)} aria-label="Close popup" className="rounded-lg p-2 hover:bg-[#faf7f3] disabled:opacity-50 dark:hover:bg-white/5"><X size={18} /></button>
              </div>
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div className="rounded-xl border border-[#eadfd5] bg-[#faf7f3] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm text-[#8b7668] dark:text-slate-400">Selected plan</p>
                  <div className="mt-1 flex items-end justify-between gap-3"><h3 className="text-lg font-bold">{selectedPlan.name}</h3><p className="text-xl font-bold">{formatMoney(getPlanPrice(selectedPlan, interval), subscription?.currency)}<span className="text-xs font-medium text-[#8b7668]">/{interval === 'monthly' ? 'mo' : 'yr'}</span></p></div>
                </div>
                <div>
                  <label htmlFor="billing-interval" className="mb-1.5 block text-sm font-medium">Billing cycle</label>
                  <select id="billing-interval" value={interval} onChange={(event) => setInterval(event.target.value as PlanInterval)} className={inputClass}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Plan includes</p>
                  <ul className="space-y-2">{(selectedPlan.features?.length ? selectedPlan.features : defaultFeatures(selectedPlan)).map((feature) => <li key={feature} className="flex gap-2 text-sm text-[#765b4a] dark:text-slate-300"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{feature}</li>)}</ul>
                </div>
                {modalError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertCircle size={17} className="mt-0.5 shrink-0" />{modalError}</div>}
                <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">Demo mode: this saves the plan selection to JSON Server and does not charge a payment method.</p>
                <div className="flex flex-col-reverse gap-2 border-t border-[#eadfd5] pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
                  <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="rounded-xl border border-[#eadfd5] px-4 py-2.5 text-sm font-semibold hover:bg-[#faf7f3] disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#65371f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e5f55b] dark:text-[#171a10]">
                    {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}{saving ? 'Saving...' : 'Confirm plan'}
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

function normalizePlan(plan: SubscriptionPlan): SubscriptionPlan {
  const raw = plan as SubscriptionPlan & Record<string, unknown>;
  const price = Number(raw.price ?? 0);
  return {
    ...plan,
    monthlyPrice: Number(raw.monthlyPrice ?? raw.monthly_price ?? price),
    yearlyPrice: Number(raw.yearlyPrice ?? raw.yearly_price ?? (price ? price * 10 : 0)),
    features: Array.isArray(raw.features) ? raw.features as string[] : [],
    limits: raw.limits || {
      feedback: Number(raw.feedbackLimit ?? raw.feedback_limit ?? 100),
      members: Number(raw.memberLimit ?? raw.member_limit ?? 3),
      workspaces: Number(raw.workspaceLimit ?? raw.workspace_limit ?? 1),
    },
  };
}

function getPlanPrice(plan: SubscriptionPlan | undefined, interval: PlanInterval): number {
  if (!plan) return 0;
  if (interval === 'yearly') return Number(plan.yearlyPrice ?? (Number(plan.monthlyPrice ?? plan.price ?? 0) * 10));
  return Number(plan.monthlyPrice ?? plan.price ?? 0);
}

function defaultFeatures(plan: SubscriptionPlan): string[] {
  if (plan.name.toLowerCase().includes('free')) return ['Basic feedback collection', 'Roadmap access', 'Community support'];
  if (plan.name.toLowerCase().includes('enterprise')) return ['Advanced team controls', 'Multiple workspaces', 'Priority support'];
  return ['Feedback management', 'Team collaboration', 'Usage analytics'];
}

function formatLimit(value?: number): string {
  return value == null || value < 0 ? 'Unlimited' : value.toLocaleString('en-IN');
}

function formatMoney(value: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(Number(value || 0));
  } catch {
    return `$${Number(value || 0).toFixed(2)}`;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function nextRenewalDate(interval: PlanInterval): string {
  const date = new Date();
  date.setMonth(date.getMonth() + (interval === 'yearly' ? 12 : 1));
  return date.toISOString().slice(0, 10);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[#eadfd5] pb-3 last:border-0 last:pb-0 dark:border-white/10"><span className="text-sm text-[#8b7668] dark:text-slate-400">{label}</span><span className="text-right text-sm font-semibold capitalize">{value}</span></div>;
}

function UsageCard({ title, icon, used, limit, color }: { title: string; icon: React.ReactNode; used: number; limit: number; color: 'brown' | 'blue' | 'violet' }) {
  const percent = limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const colorClasses = color === 'blue' ? 'bg-blue-500' : color === 'violet' ? 'bg-violet-500' : 'bg-[#7c452a]';
  return <article className="rounded-2xl border border-[#eadfd5] bg-white p-5 dark:border-white/10 dark:bg-[#151a1c]"><div className="flex items-center justify-between gap-3"><div className="text-sm text-[#8b7668] dark:text-slate-400">{title}</div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">{icon}</span></div><div className="mt-4 flex items-end gap-2"><span className="text-3xl font-bold">{used.toLocaleString('en-IN')}</span><span className="pb-1 text-sm text-[#8b7668] dark:text-slate-400">of {limit < 0 ? '∞' : limit.toLocaleString('en-IN')}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f0e8e1] dark:bg-white/10"><div className={`h-full rounded-full ${colorClasses} transition-all duration-500`} style={{ width: `${limit < 0 ? 0 : percent}%` }} /></div><p className="mt-2 text-xs text-[#8b7668] dark:text-slate-400">{limit < 0 ? 'Unlimited usage' : `${percent}% of plan limit used`}</p></article>;
}

function Alert({ message, variant, onClose }: { message: string; variant: 'error' | 'success'; onClose: () => void }) {
  const style = variant === 'error' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300';
  return <div role={variant === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-sm ${style}`}><span>{message}</span><button type="button" onClick={onClose} aria-label="Dismiss message"><X size={16} /></button></div>;
}
