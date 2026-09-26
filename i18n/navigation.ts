import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

const navigation = createNavigation(routing);

export const {Link, usePathname, useRouter, getPathname} = navigation;

/**
 * Locale-aware `redirect`, declared `never`.
 *
 * next-intl's own `redirect` throws Next's redirect signal, but its declared
 * return type does not tell TypeScript so, and a guard such as
 * `if (!userId) redirect({ href: '/sign-in', locale })` then fails to narrow
 * `userId` for the rest of the function. Wrapping it in a function declared
 * `never` restores the narrowing every call site relies on (Slice 10c).
 */
export function redirect(...args: Parameters<typeof navigation.redirect>): never {
  navigation.redirect(...args);
  // `navigation.redirect` always throws; this line exists for the type.
  throw new Error('redirect did not throw');
}

export function permanentRedirect(...args: Parameters<typeof navigation.permanentRedirect>): never {
  navigation.permanentRedirect(...args);
  throw new Error('permanentRedirect did not throw');
}
