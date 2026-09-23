import type { DetectedNetwork } from '../../lib/detect-network';
import { cn } from '@kodem/design-system/lib/utils';

type Props = {
  network: DetectedNetwork;
  className?: string;
};

/** Compact brand marks for the connect input (lucide no longer ships brand icons). */
export function NetworkIcon({ network, className }: Props) {
  const box = cn('size-5 shrink-0', className);

  switch (network) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={box} aria-hidden>
          <defs>
            <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f58529" />
              <stop offset="50%" stopColor="#dd2a7b" />
              <stop offset="100%" stopColor="#515bd4" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={box} aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#1877F2" />
          <path
            fill="#fff"
            d="M13.5 20v-7.2h2.4l.4-2.8h-2.8V8.4c0-.8.2-1.4 1.4-1.4H16.5V4.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v2.8h2.3V20h3.2z"
          />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className={box} aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#010101" />
          <path
            fill="#25F4EE"
            d="M14.2 6.2c.6 1.4 1.7 2.5 3.1 3v2.1c-1.1-.05-2.1-.4-3-.1v3.9c0 2.3-1.9 4.2-4.2 4.2S6 17.4 6 15.1s1.9-4.2 4.2-4.2c.2 0 .5 0 .7.1v2.2c-.2-.1-.4-.1-.7-.1-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V6.2h2z"
          />
          <path
            fill="#FE2C55"
            d="M14.5 6.5c.6 1.4 1.7 2.5 3.1 3v2.1c-1.1-.05-2.1-.4-3-.1v3.9c0 2.3-1.9 4.2-4.2 4.2-.7 0-1.4-.2-2-.5 1.1.9 2.6 1.1 3.9.4 1.4-.7 2.3-2.1 2.3-3.7V6.5h-.1z"
            opacity="0.9"
          />
          <path
            fill="#fff"
            d="M14.2 6.2c.6 1.4 1.7 2.5 3.1 3v2.1c-1.1-.05-2.1-.4-3-.1v3.9c0 2.3-1.9 4.2-4.2 4.2S6 17.4 6 15.1s1.9-4.2 4.2-4.2c.2 0 .5 0 .7.1v2.2c-.2-.1-.4-.1-.7-.1-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V6.2h2z"
          />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={box} aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
          <path fill="#fff" d="M10.5 9.2v5.6l5-2.8-5-2.8z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" className={box} aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2" />
          <path
            fill="#fff"
            d="M7.2 10.2h2.1v6.8H7.2v-6.8zm1-3.2c.7 0 1.2.5 1.2 1.2S8.9 9.4 8.2 9.4 7 8.9 7 8.2s.5-1.2 1.2-1.2zM11.2 10.2h2v.9c.3-.6 1.1-1.1 2.2-1.1 2.3 0 2.8 1.5 2.8 3.5v3.5h-2.1v-3.1c0-.7 0-1.7-1-1.7s-1.2.8-1.2 1.6v3.2h-2.1v-6.8z"
          />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className={box} aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#000" />
          <path
            fill="#fff"
            d="M7.2 7h2.5l2.3 3.2L14.8 7H17l-3.4 4.1L17.2 17h-2.5l-2.5-3.5L9.2 17H7l3.6-4.4L7.2 7z"
          />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" className={box} aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#25D366" />
          <path
            fill="#fff"
            d="M12.1 6.4c-3.1 0-5.6 2.5-5.6 5.6 0 1 .3 1.9.8 2.7l-.8 3 3.1-.8c.8.4 1.6.7 2.5.7 3.1 0 5.6-2.5 5.6-5.6s-2.5-5.6-5.6-5.6zm3.2 7.9c-.1.4-.7.7-1.1.8-.3.1-.7.1-1.1 0-.3-.1-.6-.1-.9-.3-1.5-.7-2.5-2.1-2.6-2.2-.1-.1-.8-1.1-.8-2.1 0-1 .5-1.5.7-1.7.2-.2.4-.2.6-.2h.4c.1 0 .3 0 .4.3.2.4.5 1.3.6 1.4.1.1.1.2 0 .4l-.3.4c-.1.1-.2.2-.1.4.1.2.4.7.9 1.1.6.5 1.1.7 1.3.8.2.1.3.1.4 0l.5-.6c.1-.1.3-.1.4-.1.2 0 1 .5 1.2.6.2.1.3.1.3.2.1.3 0 .8-.1 1.1z"
          />
        </svg>
      );
    case 'website':
    default:
      return (
        <svg viewBox="0 0 24 24" className={box} aria-hidden fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" className="text-muted-foreground" />
          <path
            d="M3.5 12h17M12 3.5c2.5 2.8 2.5 13.7 0 16.5M12 3.5C9.5 6.3 9.5 17.2 12 20"
            stroke="currentColor"
            strokeWidth="1.75"
            className="text-muted-foreground"
          />
        </svg>
      );
  }
}
