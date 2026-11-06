import { createContext, useContext } from "react";
export interface Appearance {
  featureImageUrl: string;
  dwuLogoUrl: string;
  mcsLogoUrl: string;
  accent: string;
  surface: string;
  heroImageUrl: string;
  heroWord: string;
  motion: boolean;
  layout: "spacious" | "compact";
  rotationSeconds: number;
  useGallery: boolean;
}
export const defaultAppearance: Appearance = {
  featureImageUrl: "",
  dwuLogoUrl: "",
  mcsLogoUrl: "",
  accent: "#dfff00",
  surface: "#dfdff0",
  heroImageUrl: "",
  heroWord: "BEYOND.",
  motion: true,
  layout: "spacious",
  rotationSeconds: 8,
  useGallery: true,
};
export const Context = createContext(defaultAppearance);
export const useAppearance = () => useContext(Context);
