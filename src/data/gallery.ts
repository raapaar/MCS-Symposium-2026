import type { GalleryItem } from "../types/gallery";

import heroImage from "../assets/hero.png";
import dwuLogo from "../assets/Divine_Word_University_logo.png";
import mcsLogo from "../assets/MCS-logo2.png";

export const galleryItems: GalleryItem[] = [
  {
    id: "gallery-1",
    title: "MCS Symposium 2026",
    description:
      "Development placeholder for the symposium gallery.",
    image: heroImage,
    category: "Symposium",
    published: true,
  },
  {
    id: "gallery-2",
    title: "Divine Word University",
    description:
      "Development placeholder for university-related event imagery.",
    image: dwuLogo,
    category: "University",
    published: true,
  },
  {
    id: "gallery-3",
    title: "Mathematics and Computing Science",
    description:
      "Development placeholder for department-related imagery.",
    image: mcsLogo,
    category: "Department",
    published: true,
  },
];