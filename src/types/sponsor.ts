export type SponsorTier =
  | "gold"
  | "silver"
  | "bronze"
  | "partner";

export interface Sponsor {
  id: string;

  name: string;
  description: string;

  // Sponsor branding
  logo: string;
  logoPath: string;

  // External website
  website: string;

  // Sponsor classification
  category: string;
  tier: SponsorTier;

  // Display controls
  order: number;
  published: boolean;
}