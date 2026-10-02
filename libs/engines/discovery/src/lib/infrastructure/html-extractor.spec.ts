import { WebsiteProvider } from '../providers/website.provider';
import {
  decodeCloudflareEmail,
  extractCleanVisibleExcerpt,
  extractEmails,
  extractOfferHeadings,
  extractPhones,
} from './html-extractor';

function encodeCloudflare(email: string, key = 0x41): string {
  let hex = key.toString(16).padStart(2, '0');
  for (const char of email) {
    hex += (char.charCodeAt(0) ^ key).toString(16).padStart(2, '0');
  }
  return hex;
}

const EMAIL = 'golakiva@gmail.com';
const CF = encodeCloudflare(EMAIL);

const BIZMEDIA_HTML = `
<!doctype html>
<html lang="he">
<head>
  <title>BizMedia</title>
  <meta property="og:site_name" content="BizMedia"/>
  <script type="application/ld+json">{"@context":"https://schema.org/","@type":"WebSite","name":"BizMedia","url":"https://www.bizmedia.co.il"}</script>
  <script>var junk = "545352419";</script>
</head>
<body>
  <h1>יותר לקוחות, יותר פגישות יותר רווח לעסק.</h1>
  <p>ביזמדיה בונה לעסקים מנועי צמיחה באמצעות קידום בגוגל, פרסום ממומן, שיווק ברשתות חברתיות ואוטומציות שנותנות מענה ללידים 24/7. סוכנות בוטיק עם יחס אישי. שיחת ייעוץ ראשונה ללא עלות.</p>
  <h2>אוטומציות ללידים ותיאום פגישות</h2>
  <h2>שיווק מבוסס ריווחיות</h2>
  <h2>מיקוד עסקי</h2>
  <h2>אנחנו במרחק של שיחת טלפון</h2>
  <a href="tel:+972526933385">0526933385</a>
  <a href="/cdn-cgi/l/email-protection#${CF}">email</a>
  <p>c 2035 by EPS Marketing. Powered and secured by Wix</p>
</body>
</html>
`;

describe('homepage extraction', () => {
  it('decodes a Cloudflare email and ignores script phone noise', () => {
    expect(decodeCloudflareEmail(CF)).toBe(EMAIL);
    expect(extractEmails(BIZMEDIA_HTML)).toEqual([EMAIL]);
    expect(extractPhones(BIZMEDIA_HTML)).toEqual(['+972526933385']);
    expect(extractPhones(BIZMEDIA_HTML).join(' ')).not.toContain('545352419');
  });

  it('keeps offer headings and drops the contact call to action', () => {
    expect(extractOfferHeadings(BIZMEDIA_HTML, 'BizMedia')).toEqual([
      'אוטומציות ללידים ותיאום פגישות',
      'שיווק מבוסס ריווחיות',
      'מיקוד עסקי',
    ]);
  });

  it('turns a Wix homepage into name, email, phone, services, and pitch', async () => {
    const provider = new WebsiteProvider();
    const result = await provider.discover(
      {
        id: 'site',
        type: 'WEBSITE',
        source: 'seed',
        url: 'https://bizmedia.co.il/',
        status: 'pending',
        priority: 100,
        depth: 0,
      },
      {
        fetchText: async (url) =>
          url.startsWith('https://bizmedia.co.il') && !url.includes('robots')
            ? BIZMEDIA_HTML
            : null,
        fetchCount: 0,
        maxFetches: 15,
      },
    );

    const fact = (field: string) => result.facts.find((item) => item.field === field);

    expect(fact('emails')?.value).toEqual([EMAIL]);
    expect(fact('phones')?.value).toEqual(['+972526933385']);
    expect(fact('services')?.value).toEqual([
      'אוטומציות ללידים ותיאום פגישות',
      'שיווק מבוסס ריווחיות',
      'מיקוד עסקי',
    ]);
    const description = String(fact('description')?.value ?? '');
    expect(description).toContain('קידום בגוגל');
    expect(description).not.toContain('545352419');
    expect(description).not.toContain('var junk');
  });
});

const HOTEL_HTML = `
<html><head><title>מלונות בישראל: רשת מלונות ישרוטל - המובילה בישראל</title></head>
<body>
<nav>
  <a>דילים לאילת</a>
  <a>רויאל ביץ&#39; אילת</a>
  <a>כניסה לחברי מועדון</a>
</nav>
<h1>רשת מלונות ישרוטל</h1>
<h2>איתכם בכל חופשה שתבחרו</h2>
<p>ישרוטל היא רשת מלונות ישראלית. היא מפעילה מלונות נופש, יוקרה ועיצוב באילת, בירושלים, בתל אביב ובצפון.</p>
<h2>חיפושים אחרונים</h2>
<h2>מבצעים וחבילות</h2>
<h3>מהירי החלטה</h3>
<p>בלעדי למזמינים באתר. דילים מיוחדים למהירי החלטה במגוון מלונות ישרוטל ברחבי הארץ.</p>
<h2>מעוניינים שנספר לכם על כל ההטבות?</h2>
</body></html>
`;

describe('a large homepage', () => {
  it('reads sentences and drops the menu, the search widget, and the newsletter', () => {
    const excerpt = extractCleanVisibleExcerpt(HOTEL_HTML);
    expect(excerpt).toContain('רשת מלונות ישראלית');
    expect(excerpt).not.toContain('דילים לאילת');
    expect(excerpt).not.toContain('כניסה לחברי מועדון');
    expect(excerpt).not.toContain('&#39;');

    expect(extractOfferHeadings(HOTEL_HTML, 'ישרוטל')).toEqual([
      'איתכם בכל חופשה שתבחרו',
      'מבצעים וחבילות',
      'מהירי החלטה',
    ]);
  });
});
