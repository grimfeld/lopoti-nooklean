import { DEFAULT_SERVICES_CONFIG, resolveAnimals, type ServicesConfig } from '@lopoti-nooklean/db/schema';

import { API_ORIGIN } from '@/lib/config';

import { HomeClient } from './home-client';

/**
 * Lopoti home page.
 *
 * The service catalogue is fetched on the server so the page arrives complete:
 * a visitor (or a search engine) sees the real services in the HTML rather than
 * a flash of placeholder while JavaScript loads.
 *
 * If the back office is unreachable the shipped defaults are used, so an API
 * outage degrades to a working site rather than an empty one.
 */

async function loadConfig(): Promise<ServicesConfig> {
  try {
    const response = await fetch(`${API_ORIGIN}/api/config`, {
      // The catalogue changes rarely and is edited by one person; a minute of
      // staleness is a fair price for not hitting the database on every visit.
      next: { revalidate: 60 },
    });
    if (!response.ok) return DEFAULT_SERVICES_CONFIG;

    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null && 'config' in data) {
      return (data as { config: ServicesConfig }).config;
    }
  } catch {
    // Unreachable API: fall through to the defaults below.
  }
  return DEFAULT_SERVICES_CONFIG;
}

export default async function HomePage() {
  const config = await loadConfig();
  const animals = resolveAnimals(config);

  return (
    <HomeClient
      animals={animals.length > 0 ? animals : resolveAnimals(DEFAULT_SERVICES_CONFIG)}
      potes={config.potes.length > 0 ? config.potes : DEFAULT_SERVICES_CONFIG.potes}
    />
  );
}
