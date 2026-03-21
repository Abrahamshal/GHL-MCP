/**
 * Standalone entry point — mounts the iframe-embeddable UITree renderer.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StandaloneApp } from "./StandaloneApp.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StandaloneApp />
  </StrictMode>,
);
