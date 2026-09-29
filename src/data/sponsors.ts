import type { Sponsor } from "../types/sponsor";

import dwuLogo from "../assets/Divine_Word_University_logo.png";
import mcsLogo from "../assets/MCS-logo2.png";

export const sponsors: Sponsor[] = [
  {
    id: "sponsor-1",

    name:
      "Divine Word University",

    description:
      "Development placeholder for an event partner or supporting organization.",

    logo: dwuLogo,
    logoPath: "",

    website: "#",

    category:
      "Development Placeholder",

    tier: "partner",

    order: 1,
    published: true,
  },

  {
    id: "sponsor-2",

    name:
      "Mathematics and Computing Science",

    description:
      "Development placeholder for an event partner or supporting organization.",

    logo: mcsLogo,
    logoPath: "",

    website: "#",

    category:
      "Development Placeholder",

    tier: "partner",

    order: 2,
    published: true,
  },
];