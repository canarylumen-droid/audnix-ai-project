import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
createRoot(document.getElementById("root")!).render(
  <>
    <App />
  </>
);
