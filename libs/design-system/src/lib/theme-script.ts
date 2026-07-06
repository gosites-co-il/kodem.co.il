/** Inline script to set theme class before paint (avoids FOUC). */
export const THEME_STORAGE_KEY = 'theme';

export function getThemeInitScript(): string {
  return `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k)||'system';var d=document.documentElement;var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)d.classList.add('dark');else d.classList.remove('dark')}catch(e){}})();`;
}
