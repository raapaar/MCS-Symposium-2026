export interface EventInfo {
  id: string;

  // Core event information
  title: string;
  department: string;
  university: string;
  year: number;
  description: string;
  venue: string;
  location: string;

  // About Symposium
  aboutTitle: string;
  aboutContent: string;

  // Event date and countdown
  eventDate: string;
  eventStartTime: string;

  // Contact information
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;

  // Head of Department welcome
  hodName: string;
  hodTitle: string;
  hodMessage: string;
  hodImageUrl: string;
  hodImagePath: string;

  // Hero section
  heroTagline: string;
  heroImageUrl: string;
  heroImagePath: string;

  published: boolean;
}

