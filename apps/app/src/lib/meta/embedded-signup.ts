/**
 * Meta WhatsApp Embedded Signup (Facebook JS SDK).
 * @see https://developers.facebook.com/docs/whatsapp/embedded-signup
 */

export type WhatsAppNumberStatus = 'business_app' | 'new_or_inactive';

export interface EmbeddedSignupSession {
  wabaId?: string;
  phoneNumberId?: string;
  event?: string;
}

export interface EmbeddedSignupResult {
  code: string;
  session: EmbeddedSignupSession;
}

export interface LaunchEmbeddedSignupOptions {
  appId: string;
  configId: string;
  graphVersion?: string;
  /** When true, launches Coexistence (WhatsApp Business app) onboarding. */
  coexistence?: boolean;
  /** Optional phone digits for setup prefill (no +). */
  phoneDigits?: string;
  phoneCountryCode?: number;
}

declare global {
  interface Window {
    FB?: {
      init: (opts: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          status?: string;
          authResponse?: { code?: string; accessToken?: string };
        }) => void,
        options: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const SESSION_WAIT_MS = 4000;

let sdkLoadPromise: Promise<void> | null = null;
let initAppId: string | null = null;

function loadFacebookSdk(appId: string, graphVersion: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Embedded Signup requires a browser'));
  }
  if (window.FB && initAppId === appId) {
    return Promise.resolve();
  }
  if (sdkLoadPromise && initAppId === appId) {
    return sdkLoadPromise;
  }

  initAppId = appId;
  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    const prevInit = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      try {
        prevInit?.();
        window.FB?.init({
          appId,
          autoLogAppEvents: true,
          xfbml: false,
          version: graphVersion.startsWith('v') ? graphVersion : `v${graphVersion}`,
        });
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('FB.init failed'));
      }
    };

    if (document.querySelector(`script[src="${SDK_SRC}"]`)) {
      if (window.FB) {
        window.fbAsyncInit();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () =>
      reject(new Error('טעינת Facebook SDK נכשלה — רעננו את הדף'));
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
}

function isMetaOrigin(origin: string): boolean {
  return (
    origin === 'https://www.facebook.com' ||
    origin === 'https://web.facebook.com'
  );
}

function parseSessionMessage(data: unknown): EmbeddedSignupSession | null {
  let payload = data;
  if (typeof data === 'string') {
    try {
      payload = JSON.parse(data) as unknown;
    } catch {
      return null;
    }
  }
  if (!payload || typeof payload !== 'object') return null;
  const msg = payload as {
    type?: string;
    event?: string;
    data?: { waba_id?: string; phone_number_id?: string };
  };
  if (msg.type !== 'WA_EMBEDDED_SIGNUP') return null;
  return {
    event: msg.event,
    wabaId: msg.data?.waba_id,
    phoneNumberId: msg.data?.phone_number_id,
  };
}

/**
 * Launch Meta WhatsApp Embedded Signup. Must be called from a user click
 * (popup blockers reject async-delayed FB.login).
 */
export async function launchWhatsAppEmbeddedSignup(
  options: LaunchEmbeddedSignupOptions,
): Promise<EmbeddedSignupResult> {
  const graphVersion = options.graphVersion ?? 'v21.0';
  await loadFacebookSdk(options.appId, graphVersion);

  if (!window.FB) {
    throw new Error('Facebook SDK לא מוכן — רעננו את הדף ונסו שוב');
  }

  let session: EmbeddedSignupSession = {};
  const onMessage = (event: MessageEvent) => {
    if (!isMetaOrigin(event.origin)) return;
    const parsed = parseSessionMessage(event.data);
    if (!parsed) return;
    session = {
      ...session,
      ...parsed,
      wabaId: parsed.wabaId ?? session.wabaId,
      phoneNumberId: parsed.phoneNumberId ?? session.phoneNumberId,
    };
  };
  window.addEventListener('message', onMessage);

  const extras: Record<string, unknown> = {
    setup: {},
  };
  if (options.coexistence) {
    extras['featureType'] = 'whatsapp_business_app_onboarding';
  }
  if (options.phoneDigits) {
    extras['setup'] = {
      business: {
        phone: {
          code: options.phoneCountryCode ?? 972,
          number: options.phoneDigits,
        },
      },
    };
  }

  try {
    const code = await new Promise<string>((resolve, reject) => {
      window.FB!.login(
        (response) => {
          const authCode = response.authResponse?.code;
          if (authCode) {
            resolve(authCode);
            return;
          }
          reject(
            new Error(
              response.status === 'unknown'
                ? 'החיבור בוטל או נחסם — אפשרו חלונות קופצים ונסו שוב'
                : 'לא התקבל קוד הרשאה מ-Meta',
            ),
          );
        },
        {
          config_id: options.configId,
          response_type: 'code',
          override_default_response_type: true,
          extras,
        },
      );
    });

    // Session postMessage can arrive slightly after the login callback.
    const deadline = Date.now() + SESSION_WAIT_MS;
    while (
      Date.now() < deadline &&
      !session.wabaId &&
      !session.phoneNumberId
    ) {
      await new Promise((r) => setTimeout(r, 200));
    }

    return { code, session };
  } finally {
    window.removeEventListener('message', onMessage);
  }
}

/** Normalize Israeli / local phone input to digits for Meta setup.phone.number. */
export function normalizePhoneDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('972')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}
