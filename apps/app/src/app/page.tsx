import { redirect } from 'next/navigation';
import { ROUTES } from '../lib/constants';

/** Root routes into the entry resolver (auth → workspace → dashboard/setup). */
export default function HomePage() {
  redirect(ROUTES.entry);
}
