import { BackOffice } from './back-office';

/**
 * Back office entry point.
 *
 * Rendering is client-side behind a password gate rather than server-rendered
 * with a session check. That keeps this app's pages trivially static and puts
 * every authorisation decision in one place — the API routes — instead of
 * splitting it between page rendering and data fetching.
 */
export default function Page() {
  return <BackOffice />;
}
