import { HomeClient } from './home-client';

/**
 * Nooklean home page.
 *
 * Unlike Lopoti, the catalogue here is fixed in code: three services that have
 * not changed since the business started. When the owner wants them editable
 * they move to `site_config` the same way Lopoti's did.
 */
export default function HomePage() {
  return <HomeClient />;
}
