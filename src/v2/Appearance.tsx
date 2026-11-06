import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { Context, defaultAppearance } from "./appearanceState";
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState(defaultAppearance);
  useEffect(
    () =>
      onSnapshot(
        doc(db, "siteSettings", "appearance"),
        (snapshot) => {
          const d = snapshot.data();
          if (!d) return;
          setAppearance({
            featureImageUrl:
              typeof d.featureImageUrl === "string" &&
              /^(https:\/\/|\/api\/storage\/file\/branding)/.test(
                d.featureImageUrl,
              )
                ? d.featureImageUrl
                : "",
            dwuLogoUrl:
              typeof d.dwuLogoUrl === "string" &&
              /^(https:\/\/|\/api\/storage\/file\/branding)/.test(d.dwuLogoUrl)
                ? d.dwuLogoUrl
                : "",
            mcsLogoUrl:
              typeof d.mcsLogoUrl === "string" &&
              /^(https:\/\/|\/api\/storage\/file\/branding)/.test(d.mcsLogoUrl)
                ? d.mcsLogoUrl
                : "",
            accent: /^#[a-f0-9]{6}$/i.test(d.accent)
              ? d.accent
              : defaultAppearance.accent,
            surface: /^#[a-f0-9]{6}$/i.test(d.surface)
              ? d.surface
              : defaultAppearance.surface,
            heroImageUrl:
              typeof d.heroImageUrl === "string" &&
              /^(https:\/\/|\/api\/storage\/file\/branding)/.test(
                d.heroImageUrl,
              )
                ? d.heroImageUrl
                : "",
            heroWord:
              typeof d.heroWord === "string"
                ? d.heroWord.slice(0, 16)
                : defaultAppearance.heroWord,
            motion: d.motion !== false,
            layout: d.layout === "compact" ? "compact" : "spacious",
            rotationSeconds:
              typeof d.rotationSeconds === "number" &&
              d.rotationSeconds >= 6 &&
              d.rotationSeconds <= 30
                ? d.rotationSeconds
                : 8,
            useGallery: d.useGallery !== false,
          });
        },
        () => {
          /* Keep the built-in theme if settings are not configured. */
        },
      ),
    [],
  );
  return <Context.Provider value={appearance}>{children}</Context.Provider>;
}
