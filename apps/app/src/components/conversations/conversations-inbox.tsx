'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Camera,
  Globe,
  Mail,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Phone,
  Search,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { CHANNEL_TYPES, CONVERSATION_REPLY_CHANNELS } from '@kodem/contracts';
import type {
  ChannelType,
  ConversationDetail,
  ConversationSummary,
} from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { ScrollArea } from '@kodem/design-system/components/ui/scroll-area';
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import { cn } from '@kodem/design-system/lib/utils';
import { api, isApiError } from '../../lib/api';
import { CrmEmpty, CrmError, CrmLoading, CrmStatusBadge } from '../crm/crm-ui';
import {
  CONVERSATION_CHANNEL_LABELS,
  CONVERSATION_STATUS_LABELS,
  conversationLeadLabel,
  formatConversationTime,
} from '../../lib/conversations';

const CHANNEL_ICONS: Record<ChannelType, LucideIcon> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  facebook_messenger: MessagesSquare,
  email: Mail,
  web_chat: Globe,
  sms: MessageSquare,
  telegram: Send,
  phone: Phone,
};

function canReply(channel: ChannelType): boolean {
  return CONVERSATION_REPLY_CHANNELS.includes(
    channel as (typeof CONVERSATION_REPLY_CHANNELS)[number],
  );
}

function PersonMark({
  name,
  channel,
  size = 'sm',
}: {
  name: string;
  channel: ChannelType;
  size?: 'sm' | 'lg';
}) {
  const initial = name.trim().slice(0, 1) || '?';
  const Icon = CHANNEL_ICONS[channel];
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={cn(
          'flex items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground',
          size === 'lg' ? 'size-14 text-lg' : 'size-10 text-sm',
        )}
        aria-hidden
      >
        {initial}
      </span>
      <span className="absolute -bottom-0.5 -end-0.5 flex size-5 items-center justify-center rounded-full border-2 border-card bg-background text-foreground">
        <Icon className="size-3" aria-hidden />
      </span>
    </span>
  );
}

function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        pressed
          ? 'bg-secondary/15 text-secondary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function CustomerRail({ conversation }: { conversation: ConversationDetail }) {
  const facts = [
    ['טלפון', conversation.contact.phone || '—'],
    ['אימייל', conversation.contact.email || '—'],
    ['סטטוס ליד', conversationLeadLabel(conversation.lead?.status)],
    ['מקור', CONVERSATION_CHANNEL_LABELS[conversation.channel]],
    ...(conversation.utmSource || conversation.utmMedium || conversation.utmCampaign
      ? [[
          'UTM',
          [conversation.utmSource, conversation.utmMedium, conversation.utmCampaign]
            .filter(Boolean)
            .join(' · '),
        ] as [string, string]]
      : []),
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <PersonMark name={conversation.contact.name} channel={conversation.channel} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{conversation.contact.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {conversation.contact.email || CONVERSATION_CHANNEL_LABELS[conversation.channel]}
          </p>
        </div>
      </div>
      <dl className="divide-y text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-all text-end">{value}</dd>
          </div>
        ))}
      </dl>
      <Button asChild variant="outline" className="w-full">
        <Link href={`/crm/contacts/${conversation.contact.id}`}>פתיחת איש קשר</Link>
      </Button>
    </div>
  );
}

export function ConversationsInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');
  const [channel, setChannel] = useState<ChannelType | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function loadList() {
    setLoadingList(true);
    try {
      const res = await api.listConversations({
        channel: channel === 'all' ? undefined : channel,
        unread: unreadOnly || undefined,
        q: debouncedQuery || undefined,
      });
      setRows(res.conversations);
      setCounts(Object.fromEntries(res.counts.map((item) => [item.channel, item.count])));
      setUnreadCount(res.unreadCount);
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שגיאה בטעינת השיחות');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    setLoadingList(true);
    void (async () => {
      try {
        const res = await api.listConversations({
          channel: channel === 'all' ? undefined : channel,
          unread: unreadOnly || undefined,
          q: debouncedQuery || undefined,
        });
        if (ignore) return;
        setRows(res.conversations);
        setCounts(Object.fromEntries(res.counts.map((item) => [item.channel, item.count])));
        setUnreadCount(res.unreadCount);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setError(isApiError(err) ? err.message : 'שגיאה בטעינת השיחות');
      } finally {
        if (!ignore) setLoadingList(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [channel, unreadOnly, debouncedQuery]);

  useEffect(() => {
    setShowCustomer(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }
    let cancelled = false;
    setLoadingThread(true);
    void (async () => {
      try {
        const res = await api.getConversation(conversationId);
        if (cancelled) return;
        setConversation(res.conversation);
        setError(null);
        if (res.conversation.unread) {
          const read = await api.markConversationRead(conversationId);
          if (!cancelled) {
            setConversation(read.conversation);
            setRows((current) =>
              current.map((row) =>
                row.id === conversationId ? { ...row, unread: false } : row,
              ),
            );
            setUnreadCount((count) => Math.max(0, count - 1));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setConversation(null);
          setError(isApiError(err) ? err.message : 'שגיאה בטעינת השיחה');
        }
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  function openConversation(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('conversationId', id);
    router.push(`/conversations?${params.toString()}`);
  }

  function closeConversation() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('conversationId');
    const qs = params.toString();
    router.push(qs ? `/conversations?${qs}` : '/conversations');
  }

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!conversation || !reply.trim()) return;
    setSending(true);
    try {
      const res = await api.replyConversation(conversation.id, reply.trim());
      setConversation(res.conversation);
      setReply('');
      await loadList();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'השליחה נכשלה');
    } finally {
      setSending(false);
    }
  }

  async function syncEmail() {
    setSyncing(true);
    try {
      await api.syncConversationEmail();
      await loadList();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'סנכרון האימייל נכשל');
    } finally {
      setSyncing(false);
    }
  }

  const list = (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="space-y-3 border-b p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="חיפוש לפי שם, נושא או הודעה"
            aria-label="חיפוש שיחות"
            className="ps-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          <FilterChip
            pressed={channel === 'all' && !unreadOnly}
            onClick={() => {
              setChannel('all');
              setUnreadOnly(false);
            }}
          >
            הכל
          </FilterChip>
          <FilterChip pressed={unreadOnly} onClick={() => setUnreadOnly((value) => !value)}>
            לא נקראו {unreadCount}
          </FilterChip>
          {CHANNEL_TYPES.map((item) => (
            <FilterChip
              key={item}
              pressed={channel === item}
              onClick={() => {
                setChannel(item);
                setUnreadOnly(false);
              }}
            >
              {CONVERSATION_CHANNEL_LABELS[item]} {counts[item] ?? 0}
            </FilterChip>
          ))}
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {loadingList ? (
          <div className="p-3">
            <CrmLoading label="טוען שיחות..." />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-3">
            <CrmEmpty
              title="אין שיחות"
              description="פניות מוואטסאפ, אינסטגרם, אימייל והאתר יופיעו כאן."
            />
          </div>
        ) : (
          <ul>
            {rows.map((row) => {
              const selected = row.id === conversationId;
              const title = row.subject || row.preview || 'שיחה ללא נושא';
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => openConversation(row.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-start gap-3 border-b px-3 py-3 text-start transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                      selected && 'bg-muted',
                    )}
                  >
                    <PersonMark name={row.contact.name} channel={row.channel} />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-sm',
                            row.unread ? 'font-semibold' : 'font-medium',
                          )}
                        >
                          {row.contact.name}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                          {row.unread ? (
                            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                          ) : null}
                          {formatConversationTime(row.lastMessageAt)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'block truncate text-sm',
                          row.unread ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {title}
                      </span>
                      {row.subject && row.preview ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {row.preview}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </section>
  );

  const thread = (
    <section className="flex h-full min-h-0 flex-col">
      {!conversationId ? (
        <div className="flex flex-1 items-center justify-center bg-background p-8">
          <CrmEmpty title="בחרו שיחה" description="ההודעות יופיעו כאן." />
        </div>
      ) : loadingThread || !conversation ? (
        <div className="p-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 lg:hidden"
            onClick={closeConversation}
          >
            חזרה
          </Button>
          {error ? (
            <CrmError message={error} onRetry={() => openConversation(conversationId)} />
          ) : (
            <CrmLoading label="טוען שיחה..." />
          )}
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={closeConversation}
              >
                חזרה
              </Button>
              <PersonMark name={conversation.contact.name} channel={conversation.channel} />
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">{conversation.contact.name}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {conversation.subject || CONVERSATION_CHANNEL_LABELS[conversation.channel]}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CrmStatusBadge>
                {CONVERSATION_CHANNEL_LABELS[conversation.channel]}
              </CrmStatusBadge>
              <CrmStatusBadge tone={conversation.status === 'open' ? 'secondary' : 'muted'}>
                {CONVERSATION_STATUS_LABELS[conversation.status]}
              </CrmStatusBadge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowCustomer(true)}
              >
                לקוח
              </Button>
            </div>
          </header>
          <ScrollArea className="min-h-0 flex-1 bg-background">
            <div className="space-y-3 p-4">
              {conversation.messages.map((message) => {
                const outbound = message.direction === 'outbound';
                return (
                  <div
                    key={message.id}
                    className={cn('flex', outbound ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[min(36rem,85%)] rounded-lg px-4 py-3 text-sm leading-6',
                        outbound
                          ? 'bg-primary text-primary-foreground'
                          : 'border bg-card text-foreground',
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.body || '—'}</p>
                      <p
                        className={cn(
                          'mt-2 text-xs tabular-nums',
                          outbound ? 'text-primary-foreground/80' : 'text-muted-foreground',
                        )}
                      >
                        {formatConversationTime(message.time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          {canReply(conversation.channel) ? (
            <form className="border-t bg-background p-3" onSubmit={sendReply}>
              <div className="flex items-end gap-2 rounded-lg border bg-card p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <Textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="תשובה ללקוח"
                  aria-label="תשובה ללקוח"
                  rows={2}
                  className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button type="submit" className="shrink-0" disabled={sending || !reply.trim()}>
                  {sending ? 'שולח...' : 'שלח'}
                </Button>
              </div>
            </form>
          ) : (
            <p className="border-t p-3 text-sm text-muted-foreground">
              בערוץ זה אפשר לראות את ההיסטוריה בלבד.
            </p>
          )}
        </>
      )}
    </section>
  );

  const customer = (
    <aside className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setShowCustomer(false)}
        >
          חזרה לשיחה
        </Button>
        <h2 className="text-sm font-semibold">לקוח</h2>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {conversation ? (
            <CustomerRail conversation={conversation} />
          ) : (
            <p className="text-sm text-muted-foreground">פרטי הלקוח יופיעו כאן.</p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-card sm:-mx-6 lg:-my-8">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h1 className="text-lg font-semibold">שיחות</h1>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={syncing}
          onClick={() => void syncEmail()}
        >
          {syncing ? 'מסנכרן...' : 'סנכרן אימייל'}
        </Button>
      </header>
      {error && !loadingThread ? (
        <div className="border-b px-4 py-2">
          <CrmError message={error} onRetry={() => void loadList()} />
        </div>
      ) : null}
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)_18rem]">
        <div
          className={cn(
            'h-full min-h-0 border-e',
            conversationId ? 'hidden lg:block' : 'block',
          )}
        >
          {list}
        </div>
        <div
          className={cn(
            'h-full min-h-0 border-e',
            conversationId && !showCustomer ? 'block' : 'hidden lg:block',
          )}
        >
          {thread}
        </div>
        <div className={cn('h-full min-h-0', showCustomer ? 'block' : 'hidden lg:block')}>
          {customer}
        </div>
      </div>
    </div>
  );
}
