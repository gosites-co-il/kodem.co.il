import type { ComponentType, SVGProps } from 'react';
import type { ChannelType, IntegrationId } from '@kodem/contracts';
import { FacebookIcon, GoogleIcon } from '../auth/oauth-icons';
import { cn } from '@kodem/design-system/lib/utils';

type IconProps = SVGProps<SVGSVGElement>;

function MicrosoftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

function GoogleSheetsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#0F9D58"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      />
      <path fill="#87CEAC" d="M14 2v6h6" />
      <path fill="#fff" d="M7 11h10v8H7z" />
      <path fill="#0F9D58" d="M8 12h3v2H8zm0 3h3v2H8zm4-3h4v2h-4zm0 3h4v2h-4z" />
    </svg>
  );
}

function GoogleAnalyticsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#F9AB00"
        d="M18.5 21a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 18.5 3 2.5 2.5 0 0 0 16 5.5v13a2.5 2.5 0 0 0 2.5 2.5z"
      />
      <path
        fill="#E37400"
        d="M12 21a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 12 9a2.5 2.5 0 0 0-2.5 2.5v7A2.5 2.5 0 0 0 12 21z"
      />
      <circle fill="#E37400" cx="5.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function GoogleAdsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <ellipse
        fill="#FBBC04"
        cx="8"
        cy="14"
        rx="5"
        ry="8"
        transform="rotate(-30 8 14)"
      />
      <ellipse
        fill="#4285F4"
        cx="16"
        cy="14"
        rx="5"
        ry="8"
        transform="rotate(30 16 14)"
      />
      <circle fill="#34A853" cx="12" cy="19" r="3" />
    </svg>
  );
}

function GoogleBusinessIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#4285F4"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
      />
      <circle fill="#fff" cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function MetaIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#0866FF"
        d="M12 2C6.48 2 2 6.2 2 11.4c0 3.1 1.6 5.85 4.1 7.65V22l3.75-2.05c.7.15 1.4.25 2.15.25 5.52 0 10-4.2 10-9.4S17.52 2 12 2zm1.1 12.55h-1.65l-.15-.1c-1.35-.85-2.2-1.85-2.55-2.95-.2.55-.35 1.15-.35 1.8 0 1.9 1.15 3.55 2.85 4.35l.35.15h1.5c2.55 0 4.6-1.85 4.6-4.15 0-2.25-1.85-4.1-4.6-4.1zm-3.55-1.7c.45 1.35 1.5 2.45 3 3.15-.95-1.5-1.1-3.15-.45-4.55.35-.75 1-1.35 1.85-1.7-.95.05-1.85.4-2.5 1-.7.65-1.1 1.55-1.15 2.5-.05.2-.05.4-.05.6h.3z"
      />
    </svg>
  );
}

function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="#25D366" aria-hidden {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function SlackIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#E01E5A"
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
      />
      <path
        fill="#36C5F0"
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
      />
      <path
        fill="#2EB67D"
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
      />
      <path
        fill="#ECB22E"
        d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
      />
    </svg>
  );
}

function ZoomIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#2D8CFF"
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v7a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 13.5v-7z"
      />
      <path
        fill="#2D8CFF"
        d="M18 8.5l3.2-2.1A1 1 0 0 1 23 7.2v9.6a1 1 0 0 1-1.8.8L18 15.5v-7z"
      />
    </svg>
  );
}

function EmailChannelIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#EA4335" />
      <path d="M3 7l9 7 9-7" stroke="#fff" strokeWidth="1.75" fill="none" />
    </svg>
  );
}

function InstagramChannelIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="#E4405F" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function SmsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect x="5" y="2" width="14" height="20" rx="2" fill="#6366F1" />
      <rect x="8" y="5" width="8" height="10" rx="1" fill="#fff" />
      <circle cx="12" cy="18.5" r="1" fill="#fff" />
    </svg>
  );
}

function TelegramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="#26A5E4" aria-hidden {...props}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.698.064-1.226-.461-1.901-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function PhoneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        fill="#0EA5E9"
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
      />
    </svg>
  );
}

function WebChatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        fill="#8B5CF6"
        d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
      />
      <circle cx="8" cy="10.5" r="1.25" fill="#fff" />
      <circle cx="12" cy="10.5" r="1.25" fill="#fff" />
      <circle cx="16" cy="10.5" r="1.25" fill="#fff" />
    </svg>
  );
}

export const INTEGRATION_ICONS: Record<
  IntegrationId,
  ComponentType<IconProps>
> = {
  google_workspace: GoogleIcon,
  google_sheets: GoogleSheetsIcon,
  microsoft_365: MicrosoftIcon,
  google_analytics: GoogleAnalyticsIcon,
  google_business: GoogleBusinessIcon,
  facebook: FacebookIcon,
  instagram: InstagramChannelIcon,
  meta: MetaIcon,
  google_ads: GoogleAdsIcon,
  whatsapp: WhatsAppIcon,
  slack: SlackIcon,
  zoom: ZoomIcon,
};

export const CHANNEL_ICONS: Record<ChannelType, ComponentType<IconProps>> = {
  email: EmailChannelIcon,
  whatsapp: WhatsAppIcon,
  instagram: InstagramChannelIcon,
  facebook_messenger: FacebookIcon,
  sms: SmsIcon,
  telegram: TelegramIcon,
  phone: PhoneIcon,
  web_chat: WebChatIcon,
};

export function IntegrationIcon({
  id,
  className,
}: {
  id: IntegrationId;
  className?: string;
}) {
  const Icon = INTEGRATION_ICONS[id] ?? GoogleIcon;
  return <Icon className={cn('size-7', className)} />;
}

export function ChannelIcon({
  type,
  className,
}: {
  type: ChannelType;
  className?: string;
}) {
  const Icon = CHANNEL_ICONS[type] ?? WebChatIcon;
  return <Icon className={cn('size-6', className)} />;
}
