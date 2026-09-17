import { useEffect, useState } from 'react';
import { cn } from '@kodem/design-system/lib/utils';

type Message = {
  id: string;
  from: 'lead' | 'ai' | 'system';
  text: string;
  delayMs: number;
};

const SCRIPT: Message[] = [
  { id: '1', from: 'system', text: 'ליד חדש מפייסבוק', delayMs: 400 },
  { id: '2', from: 'ai', text: 'היי! תודה שפנית אלינו 👋 איך קוראים לך?', delayMs: 1200 },
  { id: '3', from: 'lead', text: 'דני', delayMs: 2200 },
  { id: '4', from: 'ai', text: 'נעים להכיר דני. במה אפשר לעזור היום?', delayMs: 3200 },
  { id: '5', from: 'lead', text: 'רוצה לקבוע ייעוץ השבוע', delayMs: 4400 },
  {
    id: '6',
    from: 'ai',
    text: 'מעולה. יש לי פנוי מחר ב־10:00 או ב־16:30. מה נוח לך?',
    delayMs: 5600,
  },
  { id: '7', from: 'lead', text: '16:30 מעולה', delayMs: 6800 },
  {
    id: '8',
    from: 'system',
    text: 'הפגישה נקבעה ביומן · מחר 16:30',
    delayMs: 7800,
  },
];

type Props = {
  className?: string;
  caption?: string;
};

export function WhatsAppConversationDemo({
  className,
  caption = 'הדגמה מונפשת — לא שיחה חיה מהמערכת',
}: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setVisibleCount(SCRIPT.length);
      return;
    }

    setVisibleCount(0);
    const timers = SCRIPT.map((msg, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), msg.delayMs),
    );
    const restart = window.setTimeout(() => setCycle((c) => c + 1), 12000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(restart);
    };
  }, [cycle]);

  const shown = SCRIPT.slice(0, visibleCount);

  return (
    <div className={cn('w-full max-w-sm', className)}>
      <div
        className="overflow-hidden rounded-2xl border border-border bg-[#e5ddd5] shadow-soft"
        role="img"
        aria-label={caption}
      >
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            K
          </div>
          <div className="min-w-0 flex-1 text-start">
            <p className="truncate text-sm font-semibold">KODEM</p>
            <p className="text-xs text-white/80">עוזר דיגיטלי · הדגמה</p>
          </div>
        </div>

        <div className="flex min-h-[320px] flex-col gap-2 p-3">
          {shown.map((msg) => (
            <div
              key={`${cycle}-${msg.id}`}
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm animate-message-in',
                msg.from === 'lead' && 'ms-auto bg-[#dcf8c6] text-foreground',
                msg.from === 'ai' && 'me-auto bg-white text-foreground',
                msg.from === 'system' &&
                  'mx-auto max-w-[95%] bg-black/5 text-center text-xs text-muted-foreground',
              )}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}
