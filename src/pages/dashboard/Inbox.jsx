import React from 'react';
import { Search, Send, Loader2 } from 'lucide-react';
import {
  fetchWorkspaceMembers,
  fetchConversations,
  openOrCreateDM,
  fetchConversationMessages,
  postChatMessage,
} from '../../utils/api';
import { useProject } from '../../context/ProjectContext';

function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours`;
  if (s < 604800) return `${Math.floor(s / 86400)} days`;
  return new Date(iso).toLocaleDateString();
}

function localTimeLabel() {
  return new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function avatarFor(u) {
  const a = (u?.avatar_url || '').trim();
  if (a) return a;
  const n = encodeURIComponent(u?.full_name || u?.name || 'U');
  return `https://ui-avatars.com/api/?name=${n}&background=eef2ff&color=4338ca&size=128`;
}

export default function Inbox() {
  const { currentUser } = useProject();
  const myId = currentUser?.id;

  const [members, setMembers] = React.useState([]);
  const [conversations, setConversations] = React.useState([]);
  const [activeId, setActiveId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const [loadingList, setLoadingList] = React.useState(true);
  const [loadingMsg, setLoadingMsg] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [peerPick, setPeerPick] = React.useState('');
  const [starting, setStarting] = React.useState(false);
  const bottomRef = React.useRef(null);
  const pickedInitialRef = React.useRef(false);

  const loadAll = React.useCallback(async () => {
    try {
      setErr(null);
      const [m, c] = await Promise.all([fetchWorkspaceMembers(), fetchConversations()]);
      setMembers(Array.isArray(m) ? m : []);
      const list = Array.isArray(c) ? c : [];
      setConversations(list);
      if (!pickedInitialRef.current && list.length) {
        pickedInitialRef.current = true;
        setActiveId((prev) => prev || list[0].id);
      }
    } catch (e) {
      setErr(e?.message || 'Failed to load messages');
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadMessages = React.useCallback(async (convId, isBackground = false) => {
    if (!convId) return;
    if (!isBackground) setLoadingMsg(true);
    try {
      const rows = await fetchConversationMessages(convId);
      setMessages(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setErr(e?.message || 'Failed to load thread');
    } finally {
      if (!isBackground) setLoadingMsg(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeId) {
      setMessages([]);
      loadMessages(activeId, false);
    }
  }, [activeId, loadMessages]);

  React.useEffect(() => {
    if (!activeId) return undefined;
    const id = setInterval(() => loadMessages(activeId, true), 3000);
    return () => clearInterval(id);
  }, [activeId, loadMessages]);

  React.useEffect(() => {
    const onWs = (ev) => {
      const d = ev.detail;
      if (!d || d.type !== 'chat_message' || !d.message) return;
      if (d.conversation_id !== activeId) {
        loadAll();
        return;
      }
      setMessages((prev) => {
        const mid = d.message.id;
        if (prev.some((x) => x.id === mid)) return prev;
        return [...prev, d.message];
      });
    };
    window.addEventListener('cynapse-chat-message', onWs);
    return () => window.removeEventListener('cynapse-chat-message', onWs);
  }, [activeId, loadAll]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId]);

  const activeConv = conversations.find((c) => c.id === activeId);
  const other = activeConv?.other_user;

  const startDm = async () => {
    if (!peerPick) return;
    setStarting(true);
    try {
      const { id } = await openOrCreateDM(peerPick);
      await loadAll();
      setActiveId(id);
      setPeerPick('');
    } catch (e) {
      setErr(e?.message || 'Could not start conversation');
    } finally {
      setStarting(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      const msg = await postChatMessage(activeId, text);
      setDraft('');
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                last_message: { body: msg.body, created_at: msg.created_at, sender_id: msg.sender_id },
                updated_at: msg.created_at,
              }
            : c
        )
      );
    } catch (e2) {
      setErr(e2?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const peers = myId ? members.filter((u) => u.id !== myId) : [];

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Inbox</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Direct messages with teammates in your workspace.</p>
      </div>

      {err && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {err}
        </div>
      )}

      <div className="flex h-[calc(100vh-200px)] min-h-[420px] flex-col gap-6 mt-4 md:flex-row">
        <aside className="flex w-full flex-col md:w-1/3 md:min-w-[280px] md:max-w-sm">
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-black tracking-tight text-slate-900">All messages</h2>
              <span className="rounded-lg p-2 text-slate-400" aria-hidden>
                <Search size={18} />
              </span>
            </div>

            {peers.length > 0 && (
              <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">New message</p>
                <div className="flex gap-2">
                  <select
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-400"
                    value={peerPick}
                    onChange={(e) => setPeerPick(e.target.value)}
                  >
                    <option value="">Select teammate…</option>
                    {peers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!peerPick || starting}
                    onClick={startDm}
                    className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {starting ? '…' : 'Start'}
                  </button>
                </div>
              </div>
            )}

            <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto pr-1">
              {loadingList ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="py-8 text-center text-sm font-medium text-slate-500">
                  No conversations yet. {peers.length ? 'Pick a teammate above.' : 'Invite teammates to your workspace.'}
                </p>
              ) : (
                conversations.map((chat) => {
                  const selected = chat.id === activeId;
                  const preview = chat.last_message?.body || 'No messages yet';
                  const t = timeAgo(chat.last_message?.created_at || chat.updated_at);
                  const ou = chat.other_user;
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => setActiveId(chat.id)}
                      className={`flex w-full gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50 ${
                        selected ? 'bg-indigo-50/90 ring-1 ring-indigo-100' : ''
                      }`}
                    >
                      <img src={avatarFor(ou)} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">{ou?.full_name || 'User'}</span>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-400">{t}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500">{preview}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 w-full flex-1 flex-col md:w-2/3">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            {!activeId || !other ? (
              <div className="flex flex-1 items-center justify-center text-sm font-medium text-slate-500">
                Select a conversation or start a new one.
              </div>
            ) : (
              <>
                <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 pb-5">
                  <img src={avatarFor(other)} alt="" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">{other.full_name}</h3>
                    <p className="text-xs font-medium text-slate-500">
                      Local time · {localTimeLabel()}
                    </p>
                  </div>
                </header>

                <div className="custom-scrollbar mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
                  {loadingMsg ? (
                    <div className="flex flex-1 items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    </div>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_id === myId;
                      return mine ? (
                        <div
                          key={m.id}
                          className="max-w-[70%] self-end rounded-2xl bg-slate-100 p-4 text-sm font-medium leading-relaxed text-slate-800"
                        >
                          {m.body}
                        </div>
                      ) : (
                        <div
                          key={m.id}
                          className="max-w-[70%] self-start rounded-2xl bg-indigo-50 p-4 text-sm font-medium leading-relaxed text-indigo-900"
                        >
                          {m.body}
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className="mt-4 flex shrink-0 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-6 py-3">
                  <input
                    type="text"
                    placeholder="Send message..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="shrink-0 rounded-full p-2 text-indigo-600 transition hover:bg-white hover:shadow-sm disabled:opacity-40"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={20} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
