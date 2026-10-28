import { useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import {
  ArrowRight,
  BookOpen,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Lightbulb,
  LifeBuoy,
  LoaderCircle,
  Mail,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import ModalOverlay from "../../components/common/ModalOverlay";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type TicketType = "question" | "bug" | "feature";
type TicketStatus = "open" | "in_progress" | "resolved";

interface SupportTicket {
  id: string;
  workspaceId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: TicketType;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
}

const faqGroups = [
  {
    title: "Getting started",
    icon: Sparkles,
    items: [
      {
        question: "How do I create a workspace?",
        answer:
          "Open Workspaces from the sidebar and choose Create workspace. Add a name and description, then save. If you do not see this option, ask your workspace owner for access.",
      },
      {
        question: "How do I invite my teammates?",
        answer:
          "Open Team Management inside your workspace and use the invite or add-member option. Choose the appropriate role so each teammate has the access they need.",
      },
      {
        question: "Where should I collect product feedback?",
        answer:
          "Use the Feedback page to create feedback entries, review customer requests, and follow the ideas that matter most to your users.",
      },
    ],
  },
  {
    title: "Feedback and roadmap",
    icon: MessageCircle,
    items: [
      {
        question: "How do votes work?",
        answer:
          "Votes help your team understand which requests matter to users. Review the vote count and supporting comments before prioritizing a request.",
      },
      {
        question: "How do I move feedback to the roadmap?",
        answer:
          "Review a feedback item, decide whether it fits your product priorities, and create or link a roadmap item using the workflow available in your workspace.",
      },
      {
        question: "Can customers see release notes?",
        answer:
          "Use Release Notes to publish product updates. Visibility depends on your workspace settings and the access rules configured for your product.",
      },
    ],
  },
  {
    title: "Account and billing",
    icon: ShieldCheck,
    items: [
      {
        question: "How do I change my workspace settings?",
        answer:
          "Open Workspaces, select the workspace you want to manage, and open Workspace Settings. Available options depend on your role.",
      },
      {
        question: "Where can I review my plan usage?",
        answer:
          "Open Subscription & Usage to review your current plan and the usage information available to your workspace.",
      },
      {
        question: "Why can’t I access a page?",
        answer:
          "Your role may not have permission to open that page. Contact your workspace owner or an administrator to check your access.",
      },
    ],
  },
];

const ticketTypes: { value: TicketType; label: string; description: string }[] = [
  {
    value: "question",
    label: "General question",
    description: "Help using ProductPulse",
  },
  {
    value: "bug",
    label: "Report a bug",
    description: "Something is not working",
  },
  {
    value: "feature",
    label: "Suggest a feature",
    description: "Share an idea with us",
  },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: TicketStatus) {
  if (status === "in_progress") return "In progress";
  if (status === "resolved") return "Resolved";
  return "Open";
}

export default function HelpSupportPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketType, setTicketType] = useState<TicketType>("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const userId = (user as { id?: string | number } | null)?.id;
  const userName =
    (user as { name?: string; fullName?: string } | null)?.name ||
    (user as { fullName?: string } | null)?.fullName ||
    "ProductPulse user";
  const userEmail = (user as { email?: string } | null)?.email || "";
  const workspaceId = (user as { workspaceId?: string | number } | null)
    ?.workspaceId;


  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      setLoadingTickets(true);
      try {
        const response = await axios.get<SupportTicket[]>(
          `${API_URL}/supportTickets`,
        );
        const ownTickets = response.data.filter(
          (ticket) =>
            (userId != null && String(ticket.userId) === String(userId)) ||
            (userEmail !== "" && ticket.userEmail === userEmail),
        );
        if (!cancelled) {
          setTickets(
            ownTickets.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
          );
        }
      } catch {
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setLoadingTickets(false);
      }
    }

    void loadTickets();
    return () => {
      cancelled = true;
    };
  }, [userId, userEmail]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return faqGroups;
    return faqGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query) ||
            group.title.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [search]);

  const openSupportModal = (type: TicketType = "question") => {
    setTicketType(type);
    setSubject("");
    setMessage("");
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!subject.trim() || !message.trim()) {
      setError("Please enter both a subject and a description.");
      return;
    }

    setSubmitting(true);
    const ticket: Omit<SupportTicket, "id"> = {
      workspaceId: workspaceId == null ? undefined : String(workspaceId),
      userId: userId == null ? undefined : String(userId),
      userName,
      userEmail,
      type: ticketType,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await axios.post<SupportTicket>(
        `${API_URL}/supportTickets`,
        ticket,
      );
      setTickets((current) => [response.data, ...current]);
      setModalOpen(false);
      setNotice("Your request was submitted successfully.");
      setSubject("");
      setMessage("");
    } catch {
      setError(
        'Could not submit your request. Make sure JSON Server is running and "supportTickets": [] exists in db.json.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const cardClass =
    "rounded-2xl border border-[#e9e2dc] bg-white shadow-sm dark:border-[#293033] dark:bg-[#151a1c]";
  const inputClass =
    "w-full rounded-xl border border-[#e5ddd6] bg-[#fffdfa] px-4 py-3 text-sm text-[#292522] outline-none transition placeholder:text-[#a49a91] focus:border-[#9a6245] focus:ring-4 focus:ring-[#9a6245]/10 dark:border-[#343b3e] dark:bg-[#101416] dark:text-[#f3f1ef] dark:placeholder:text-[#788184]";

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-[#faf7f3] text-[#292522] dark:bg-[#0b0d0f] dark:text-[#f4f1ee]">
        <div className="mx-auto max-w-7xl space-y-7">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7c452a] via-[#925b3d] to-[#bd8b69] px-6 py-8 text-white sm:px-9 sm:py-10">
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/15" />
            <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/15" />
            <div className="relative grid gap-8 md:grid-cols-[1.4fr_0.6fr] md:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
                  <LifeBuoy size={15} />
                  ProductPulse Help Center
                </div>
                <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  How can we help you today?
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                  Find answers, learn how to use ProductPulse, or send our team a
                  support request.
                </p>
                <label className="mt-6 flex max-w-xl items-center gap-3 rounded-2xl border border-white/20 bg-white px-4 py-3 text-[#39302a] shadow-lg">
                  <Search size={19} className="shrink-0 text-[#8c7a6d]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search help articles and FAQs..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-[#9b9088]"
                    aria-label="Search help articles"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="rounded-md p-1 text-[#78695e] hover:bg-[#f3ece6]"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>
              </div>
              <div className="hidden justify-center md:flex">
                <div className="flex h-44 w-44 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/25 bg-white/10">
                    <LifeBuoy size={68} strokeWidth={1.25} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {notice && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              {notice}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => openSupportModal("question")}
              className={`${cardClass} group flex items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#c9a58e] hover:shadow-md`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f4e7dc] text-[#7c452a] dark:bg-[#39271f] dark:text-[#e2b99d]">
                <MessageCircle size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Contact support</span>
                <span className="mt-1 block text-sm leading-5 text-[#7d746d] dark:text-[#a2abad]">
                  Ask a question and get help from our team.
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#8a4f30] dark:text-[#d8a17e]">
                  Send a request <ArrowRight size={15} />
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => openSupportModal("bug")}
              className={`${cardClass} group flex items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#c9a58e] hover:shadow-md`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                <Bug size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Report a bug</span>
                <span className="mt-1 block text-sm leading-5 text-[#7d746d] dark:text-[#a2abad]">
                  Tell us about an issue you encountered.
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#8a4f30] dark:text-[#d8a17e]">
                  Report issue <ArrowRight size={15} />
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => openSupportModal("feature")}
              className={`${cardClass} group flex items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#c9a58e] hover:shadow-md`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Lightbulb size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Suggest a feature</span>
                <span className="mt-1 block text-sm leading-5 text-[#7d746d] dark:text-[#a2abad]">
                  Share an idea that could improve ProductPulse.
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#8a4f30] dark:text-[#d8a17e]">
                  Share an idea <ArrowRight size={15} />
                </span>
              </span>
            </button>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
            <div className={`${cardClass} p-5 sm:p-7`}>
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={20} className="text-[#8a4f30] dark:text-[#d8a17e]" />
                    <h2 className="text-xl font-bold">Frequently asked questions</h2>
                  </div>
                  <p className="mt-1 text-sm text-[#81776f] dark:text-[#a2abad]">
                    Quick answers to common questions.
                  </p>
                </div>
                <span className="rounded-full bg-[#f4e7dc] px-3 py-1 text-xs font-semibold text-[#7c452a] dark:bg-[#39271f] dark:text-[#e2b99d]">
                  {filteredGroups.reduce((count, group) => count + group.items.length, 0)} articles
                </span>
              </div>

              {filteredGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#ded5ce] px-5 py-10 text-center dark:border-[#343b3e]">
                  <Search size={26} className="mx-auto text-[#a49a91]" />
                  <p className="mt-3 font-semibold">No matching articles</p>
                  <p className="mt-1 text-sm text-[#81776f] dark:text-[#a2abad]">
                    Try another keyword or contact support.
                  </p>
                  <button
                    type="button"
                    onClick={() => openSupportModal("question")}
                    className="mt-4 text-sm font-semibold text-[#8a4f30] hover:underline dark:text-[#d8a17e]"
                  >
                    Contact support
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredGroups.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.title}>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#796a5e] dark:text-[#b8a99e]">
                          <GroupIcon size={17} />
                          {group.title}
                        </div>
                        <div className="divide-y divide-[#eee7e1] dark:divide-[#2b3235]">
                          {group.items.map((item) => {
                            const isOpen = activeFaq === item.question;
                            return (
                              <div key={item.question}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveFaq(isOpen ? null : item.question)
                                  }
                                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium hover:text-[#8a4f30] dark:hover:text-[#d8a17e]"
                                  aria-expanded={isOpen}
                                >
                                  <span>{item.question}</span>
                                  {isOpen ? (
                                    <ChevronDown size={18} className="shrink-0" />
                                  ) : (
                                    <ChevronRight size={18} className="shrink-0" />
                                  )}
                                </button>
                                {isOpen && (
                                  <p className="max-w-3xl pb-4 pr-6 text-sm leading-6 text-[#766d66] dark:text-[#a2abad]">
                                    {item.answer}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className={`${cardClass} p-5 sm:p-6`}>
                <div className="flex items-center gap-2">
                  <Clock3 size={19} className="text-[#8a4f30] dark:text-[#d8a17e]" />
                  <h2 className="font-bold">Your support requests</h2>
                </div>
                <p className="mt-1 text-sm text-[#81776f] dark:text-[#a2abad]">
                  Keep track of the requests you have submitted.
                </p>

                {loadingTickets ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#81776f] dark:text-[#a2abad]">
                    <LoaderCircle size={17} className="animate-spin" />
                    Loading requests...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-[#ded5ce] px-4 py-7 text-center dark:border-[#343b3e]">
                    <FileText size={24} className="mx-auto text-[#a49a91]" />
                    <p className="mt-2 text-sm font-medium">No requests yet</p>
                    <p className="mt-1 text-xs text-[#81776f] dark:text-[#a2abad]">
                      Your submitted requests will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {tickets.slice(0, 5).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-xl border border-[#eee7e1] p-3 dark:border-[#2b3235]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm font-semibold">
                            {ticket.subject}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                              ticket.status === "resolved"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : ticket.status === "in_progress"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            }`}
                          >
                            {statusLabel(ticket.status)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#81776f] dark:text-[#a2abad]">
                          <span className="capitalize">{ticket.type.replace("_", " ")}</span>
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openSupportModal("question")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8c5b7] px-4 py-3 text-sm font-semibold text-[#7c452a] transition hover:bg-[#f8eee6] dark:border-[#4a352b] dark:text-[#e2b99d] dark:hover:bg-[#2a201b]"
                >
                  <Send size={16} /> Create support request
                </button>
              </div>

              <div className={`${cardClass} p-5 sm:p-6`}>
                <div className="flex items-center gap-2">
                  <CircleHelp size={19} className="text-[#8a4f30] dark:text-[#d8a17e]" />
                  <h2 className="font-bold">Still need help?</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#81776f] dark:text-[#a2abad]">
                  Send us the details and we’ll keep your request listed here so
                  you can check its status later.
                </p>
                <button
                  type="button"
                  onClick={() => openSupportModal("question")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#65371f]"
                >
                  Get in touch <ArrowRight size={16} />
                </button>
                <p className="mt-4 flex items-center gap-2 text-xs text-[#81776f] dark:text-[#a2abad]">
                  <Mail size={14} /> Support requests are saved to your workspace.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ModalOverlay
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
  <section
    role="dialog"
    aria-modal="true"
    aria-labelledby="support-modal-title"
    className="overflow-hidden rounded-2xl"
  >
              <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eee7e1] px-5 py-4 dark:border-[#2b3235] sm:px-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4f30] dark:text-[#d8a17e]">
                    ProductPulse support
                  </p>
                  <h2 id="support-modal-title" className="mt-1 text-xl font-bold">
                    {ticketType === "bug"
                      ? "Report a bug"
                      : ticketType === "feature"
                        ? "Suggest a feature"
                        : "Contact support"}
                  </h2>
                  <p className="mt-1 text-sm text-[#81776f] dark:text-[#a2abad]">
                    Include enough detail so the team can understand your request.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-2 text-[#746a62] transition hover:bg-[#f2ebe5] dark:text-[#a2abad] dark:hover:bg-[#252c2f]"
                  aria-label="Close support form"
                >
                  <X size={20} />
                </button>
              </header>

             <form
  onSubmit={handleSubmit}
  className="hide-scrollbar min-h-0 overflow-y-auto p-5 sm:p-7"
>
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold" htmlFor="ticket-type">
                      Request type
                    </label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {ticketTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setTicketType(type.value)}
                          className={`rounded-xl border p-3 text-left transition ${
                            ticketType === type.value
                              ? "border-[#9a6245] bg-[#f7ece4] ring-2 ring-[#9a6245]/10 dark:border-[#a87859] dark:bg-[#30231d]"
                              : "border-[#e5ddd6] hover:border-[#c9a58e] dark:border-[#343b3e] dark:hover:border-[#5a6265]"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{type.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-[#81776f] dark:text-[#a2abad]">
                            {type.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold" htmlFor="support-name">
                        Your name
                      </label>
                      <input
                        id="support-name"
                        value={userName}
                        readOnly
                        className={`${inputClass} opacity-80`}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold" htmlFor="support-email">
                        Email address
                      </label>
                      <input
                        id="support-email"
                        value={userEmail}
                        readOnly
                        placeholder="No email available in your profile"
                        className={`${inputClass} opacity-80`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold" htmlFor="support-subject">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="support-subject"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      maxLength={120}
                      required
                      placeholder={
                        ticketType === "bug"
                          ? "Briefly describe the issue"
                          : ticketType === "feature"
                            ? "What would you like ProductPulse to do?"
                            : "How can we help?"
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold" htmlFor="support-message">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="support-message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      required
                      minLength={10}
                      maxLength={3000}
                      rows={5}
                      placeholder="Explain what happened, what you expected, and any useful details..."
                      className={`${inputClass} min-h-32 resize-y`}
                    />
                    <p className="mt-1 text-right text-xs text-[#81776f] dark:text-[#a2abad]">
                      {message.length}/3000 characters
                    </p>
                  </div>

                  {error && (
                    <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {error}
                    </p>
                  )}

                  <div className="flex flex-col-reverse gap-3 border-t border-[#eee7e1] pt-5 dark:border-[#2b3235] sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="rounded-xl border border-[#ded5ce] px-5 py-3 text-sm font-semibold hover:bg-[#f5eee8] dark:border-[#343b3e] dark:hover:bg-[#252c2f]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#65371f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle size={17} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Submit request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
        </section>
      </ModalOverlay>
    </DashboardLayout>
  );
}
