import { z } from 'zod';

/**
 * The service catalogue: what each site offers, and for which animal.
 *
 * This is the structured business data the owner edits in the back office
 * (decision 13). It is defined once here and consumed by all three apps, which
 * is what stops the public sites and the back office drifting apart — the
 * original codebase had two hand-synchronised copies of exactly this, with a
 * comment asking a human to keep them in step.
 *
 * Shape: a LIBRARY of services defined once, and animals that reference them by
 * id. One "Visite à domicile" can therefore be offered for cats, rabbits and
 * ferrets while existing in a single place.
 */

export const serviceItemSchema = z.object({
  id: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).default(''),
  icon: z.string().trim().max(8).default('•'),
});
export type ServiceItem = z.infer<typeof serviceItemSchema>;

export const animalRefSchema = z.object({
  slug: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  icon: z.string().trim().max(8).default('•'),
  /** Pre-selects the species field on the "compagnon" step of the form. */
  espece: z.string().trim().max(120).default(''),
  serviceIds: z.array(z.string()).default([]),
});
export type AnimalRef = z.infer<typeof animalRefSchema>;

export const poteProfileSchema = z.object({
  id: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(700).default(''),
});
export type PoteProfile = z.infer<typeof poteProfileSchema>;

export const servicesConfigSchema = z.object({
  services: z.array(serviceItemSchema).min(1, 'Au moins un service est requis'),
  animals: z.array(animalRefSchema).min(1, 'Au moins un animal est requis'),
  potes: z.array(poteProfileSchema).default([]),
});
export type ServicesConfig = z.infer<typeof servicesConfigSchema>;

/** An animal with its services already dereferenced, ready to render. */
export interface ResolvedAnimal {
  readonly slug: string;
  readonly label: string;
  readonly icon: string;
  readonly espece: string;
  readonly services: ServiceItem[];
}

/** The key under which this lives in `site_config`, for brand `lopoti`. */
export const SERVICES_CONFIG_KEY = 'services_par_animal';

/**
 * Shipped defaults.
 *
 * Embedded in the bundle so the form works before anything has been saved in
 * the back office, and so a database outage degrades to a working site rather
 * than an empty one.
 */
export const DEFAULT_SERVICES_CONFIG: ServicesConfig = {
  services: [
    {
      id: 'visite-chien',
      label: 'Visite à domicile',
      description: 'Repas, eau, jeux, présence et promenade rapide si besoin.',
      icon: '🏠',
    },
    {
      id: 'balade-chien',
      label: 'Balade & promenade',
      description:
        'Des sorties adaptées au rythme de votre chien, seul ou en petit groupe cohérent et proche géographiquement.',
      icon: '🐾',
    },
    {
      id: 'garde',
      label: 'Garde pendant vos absences',
      description:
        'Une solution construite avec vous pour les absences prolongées. Les gardes de nuit restent exceptionnelles.',
      icon: '🌙',
    },
    {
      id: 'visite-chat',
      label: 'Visite à domicile',
      description:
        'Repas, eau, litière, jeux et présence, dans le respect de son territoire et de ses habitudes.',
      icon: '🏠',
    },
    {
      id: 'visite-lapin',
      label: 'Visite à domicile',
      description:
        'Nourrissage, eau fraîche, entretien de l’espace de vie et présence adaptée à ses habitudes.',
      icon: '🏠',
    },
    {
      id: 'visite-rongeur',
      label: 'Visite à domicile',
      description:
        'Nourrissage, eau fraîche, vérification de l’habitat et présence adaptée à sa routine.',
      icon: '🏠',
    },
    {
      id: 'visite-furet',
      label: 'Visite à domicile',
      description: 'Repas, eau, nettoyage de l’espace de vie, jeux et présence selon ses habitudes.',
      icon: '🏠',
    },
    {
      id: 'visite-poisson',
      label: 'Visite à domicile',
      description:
        'Nourrissage, vérification du filtre et des paramètres essentiels, avec nettoyage léger si nécessaire.',
      icon: '🏠',
    },
    {
      id: 'visite-reptile',
      label: 'Visite à domicile',
      description:
        'Nourrissage, eau et vérification de la température, du thermostat et du taux d’humidité.',
      icon: '🏠',
    },
    {
      id: 'soins-reptile',
      label: 'Soins des NAC',
      description:
        'Entretien adapté du terrarium et changement de substrat possible en complément de la routine.',
      icon: '✨',
    },
    {
      id: 'visite-oiseau',
      label: 'Visite à domicile',
      description:
        'Nourrissage, eau fraîche, vérification de la cage et présence respectueuse de ses habitudes.',
      icon: '🏠',
    },
    {
      id: 'soins-oiseau',
      label: 'Soins des NAC',
      description: 'Entretien adapté de l’espace de vie et routine précisée ensemble selon l’espèce.',
      icon: '✨',
    },
  ],
  animals: [
    { slug: 'chien', label: 'Chien', icon: '🐕', espece: 'Chien', serviceIds: ['visite-chien', 'balade-chien', 'garde'] },
    { slug: 'chat', label: 'Chat', icon: '🐈', espece: 'Chat', serviceIds: ['visite-chat', 'garde'] },
    { slug: 'lapin', label: 'Lapin', icon: '🐰', espece: 'Lapin', serviceIds: ['visite-lapin', 'garde'] },
    { slug: 'rongeur', label: 'Rongeur', icon: '🐹', espece: 'Rongeur', serviceIds: ['visite-rongeur', 'garde'] },
    { slug: 'furet', label: 'Furet', icon: '🦦', espece: 'Autre NAC autorisé', serviceIds: ['visite-furet', 'garde'] },
    { slug: 'poisson', label: 'Poisson', icon: '🐟', espece: 'Poisson', serviceIds: ['visite-poisson'] },
    { slug: 'reptile', label: 'Reptile', icon: '🦎', espece: 'Reptile', serviceIds: ['visite-reptile', 'soins-reptile'] },
    { slug: 'oiseau', label: 'Oiseau', icon: '🦜', espece: 'Oiseau', serviceIds: ['visite-oiseau', 'soins-oiseau', 'garde'] },
  ],
  potes: [
    {
      id: 'noyam',
      name: 'Noyam',
      bio: 'Une présentation à personnaliser : racontez ici votre expérience, votre lien avec les animaux et ce qui vous tient à cœur au quotidien.',
    },
    {
      id: 'pote-2',
      name: 'Pote-sitter à compléter',
      bio: 'Ajoutez ici sa photo, son prénom, son expérience et ce qui fait de cette personne un·e super pote-sitter.',
    },
    {
      id: 'pote-3',
      name: 'Nouveau pote-sitter',
      bio: 'Ajoutez ici une nouvelle présentation pour compléter l’équipe Lopoti.',
    },
  ],
};

/**
 * Validates and normalises a configuration coming from the back office.
 *
 * Returns null when the result would leave the form with nothing to choose —
 * saving an empty catalogue would make the website look broken, so it is
 * refused with a message rather than accepted.
 */
export function sanitizeServicesConfig(raw: unknown): ServicesConfig | null {
  const parsed = servicesConfigSchema.safeParse(raw);
  if (!parsed.success) return null;

  const known = new Set(parsed.data.services.map((service) => service.id));

  // Drop references to services that no longer exist, so removing a service
  // cannot leave an animal pointing at nothing.
  const animals = parsed.data.animals.map((animal) => ({
    ...animal,
    serviceIds: [...new Set(animal.serviceIds)].filter((id) => known.has(id)),
  }));

  const potes = parsed.data.potes.length > 0 ? parsed.data.potes : DEFAULT_SERVICES_CONFIG.potes;

  return { services: parsed.data.services, animals, potes };
}

/**
 * Dereferences service ids so each animal carries its full service list.
 *
 * Animals with no services are dropped: offering one in the form would lead the
 * visitor to a dead end.
 */
export function resolveAnimals(config: ServicesConfig): ResolvedAnimal[] {
  const byId = new Map(config.services.map((service) => [service.id, service]));

  return config.animals
    .map((animal) => ({
      slug: animal.slug,
      label: animal.label,
      icon: animal.icon,
      espece: animal.espece,
      services: animal.serviceIds
        .map((id) => byId.get(id))
        .filter((service): service is ServiceItem => service !== undefined),
    }))
    .filter((animal) => animal.services.length > 0);
}
