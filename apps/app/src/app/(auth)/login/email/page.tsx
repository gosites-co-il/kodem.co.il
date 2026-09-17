import { redirect } from 'next/navigation';
import { ROUTES } from '../../../../lib/constants';

/** Legacy path — email login lives on `/login`. */
export default async function LoginEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    }
  }
  const qs = query.toString();
  redirect(qs ? `${ROUTES.login}?${qs}` : ROUTES.login);
}
