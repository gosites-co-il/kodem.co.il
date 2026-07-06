export const AUTH_SUBTITLES = [
  'כל החלטה מתחילה בקודם.',
  'העסק שלך. ברור יותר.',
  'פחות ניחושים. יותר החלטות.',
  'כל מה שהעסק צריך, במקום אחד.',
  'AI שמבין את העסק שלך.',
  'מערכת ההפעלה של העסק.',
  'מתחילים כאן.',
] as const;

export const AUTH_HERO_TITLE = 'קודם. ואז הכול מסתדר.';

export function pickRandomSubtitle(): string {
  const index = Math.floor(Math.random() * AUTH_SUBTITLES.length);
  return AUTH_SUBTITLES[index];
}
