
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { SessionProvider } from "./v2/Session";
import { AppearanceProvider } from "./v2/Appearance";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionProvider><AppearanceProvider><App /></AppearanceProvider></SessionProvider>
  </StrictMode>,
);