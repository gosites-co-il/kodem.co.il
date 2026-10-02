'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CHANNEL_TYPES, CONVERSATION_REPLY_CHANNELS } from '@kodem/contracts';
import type {
  ChannelType,
  ConversationDetail,
  ConversationSummary,
} from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@kodem/design-system/components/ui/drawer';
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

function canReply(channel: ChannelType): boolean {
  return CONVERSATION_REPLY_CHANNELS.includes(
    channel as (typeof CONVERSATION_REPLY_CHANNELS)[number],
  );
}

function CustomerRail({ conversation }: { conversation: ConversationDetail }) {
  const initial = conversation.contact.name.trim().slice(0, 1) || '?';
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{conversation.contact.name}</p>
          <p className="text-sm text-muted-foreground">
            {CONVERSATION_CHANNEL_LABELS[conversation.channel]}
          </p>
        </div>
      </div>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">טלפון</dt>
          <dd>{conversation.contact.phone || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">אימייל</dt>
          <dd className="break-all">{conversation.contact.email || '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">סטטוס ליד</dt>
          <dd>{conversationLeadLabel(conversation.lead?.status)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">מקור</dt>
          <dd>{CONVERSATION_CHANNEL_LABELS[conversation.channel]}</dd>
        </div>
        {conversation.utmSource || conversation.utmMedium || conversation.utmCampaign ? (
          <div>
            <dt className="text-muted-foreground">UTM</dt>
            <dd>
              {[conversation.utmSource, conversation.utmMedium, conversation.utmCampaign]
                .filter(Boolean)
                .join(' · ')}
            </dd>
          </div>
        ) : null}
      </dl>
      <Button asChild variant="secondary" size="sm">
        <Link href={`/crm/contacts/${conversation.contact.id}`}>איש קשר</Link>
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
    void loadList();
  }, [channel, unreadOnly, debouncedQuery]);

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
    <section className="flex min-h-0 flex-col rounded-md border">
      <div className="space-y-3 border-b p-3">
        <div className="flex items-center justify-between gap-2">
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
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="חיפוש לפי שם, נושא או הודעה"
          aria-label="חיפוש שיחות"
        />
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={channel === 'all' && !unreadOnly ? 'default' : 'outline'}
            onClick={() => {
              setChannel('all');
              setUnreadOnly(false);
            }}
          >
            הכל
          </Button>
          <Button
            type="button"
            size="sm"
            variant={unreadOnly ? 'default' : 'outline'}
            onClick={() => setUnreadOnly((value) => !value)}
          >
            לא נקראו {unreadCount}
          </Button>
          {CHANNEL_TYPES.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={channel === item ? 'default' : 'outline'}
              onClick={() => {
                setChannel(item);
                setUnreadOnly(false);
              }}
            >
              {CONVERSATION_CHANNEL_LABELS[item]} {counts[item] ?? 0}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="h-[28rem] lg:h-[calc(100vh-16rem)]">
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
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => openConversation(row.id)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b px-3 py-3 text-start hover:bg-muted/60',
                    row.id === conversationId && 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      row.unread ? 'bg-primary' : 'bg-transparent',
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{row.contact.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatConversationTime(row.lastMessageAt)}
                      </span>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {CONVERSATION_CHANNEL_LABELS[row.channel]}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {row.preview || row.subject || '—'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </section>
  );

  const thread = (
    <section className="flex min-h-[28rem] flex-col rounded-md border lg:min-h-[calc(100vh-12rem)]">
      {!conversationId ? (
        <div className="flex flex-1 items-center p-6">
          <CrmEmpty title="בחרו שיחה" description="ההודעות יופיעו כאן." />
        </div>
      ) : loadingThread || !conversation ? (
        <div className="p-4">
          {error ? (
            <CrmError message={error} onRetry={() => openConversation(conversationId)} />
          ) : (
            <CrmLoading label="טוען שיחה..." />
          )}
        </div>
      ) : (
        <>
          <header className="flex items-start justify-between gap-3 border-b p-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={closeConversation}
                >
                  חזרה
                </Button>
                <h2 className="truncate text-base font-semibold">
                  {conversation.contact.name}
                </h2>
                <CrmStatusBadge>
                  {CONVERSATION_CHANNEL_LABELS[conversation.channel]}
                </CrmStatusBadge>
                <CrmStatusBadge tone={conversation.status === 'open' ? 'secondary' : 'muted'}>
                  {CONVERSATION_STATUS_LABELS[conversation.status]}
                </CrmStatusBadge>
              </div>
            </div>
            <Drawer>
              <DrawerTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="lg:hidden">
                  פרטי לקוח
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>פרטי לקוח</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-6">
                  <CustomerRail conversation={conversation} />
                </div>
              </DrawerContent>
            </Drawer>
          </header>
          <ScrollArea className="flex-1">
            <div className="space-y-3 p-3">
              {conversation.messages.map((message) => {
                const outbound = message.direction === 'outbound';
                return (
                  <div
                    key={message.id}
                    className={cn('flex', outbound ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-md px-3 py-2 text-sm',
                        outbound
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.body || '—'}</p>
                      <p
                        className={cn(
                          'mt-1 text-xs',
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
            <form className="space-y-2 border-t p-3" onSubmit={sendReply}>
              <Textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="תשובה ללקוח"
                aria-label="תשובה ללקוח"
                rows={3}
              />
              <Button type="submit" disabled={sending || !reply.trim()}>
                {sending ? 'שולח...' : 'שלח'}
              </Button>
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

  return (
    <div className="space-y-3">
      {error && !loadingThread ? (
        <CrmError message={error} onRetry={() => void loadList()} />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)_16rem]">
        <div className={cn(conversationId ? 'hidden lg:block' : 'block')}>{list}</div>
        <div className={cn(conversationId ? 'block' : 'hidden lg:block')}>{thread}</div>
        <aside className="hidden rounded-md border p-4 lg:block">
          {conversation ? (
            <CustomerRail conversation={conversation} />
          ) : (
            <p className="text-sm text-muted-foreground">פרטי הלקוח יופיעו כאן.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
