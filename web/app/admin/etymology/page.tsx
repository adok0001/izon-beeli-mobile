import { redirect } from "next/navigation";

// Etymology is reviewer-scoped (the API gates it with `reviewerMiddleware`), so
// its canonical home moved under the reviewer-accessible `/educator` group in
// Phase 1b. Keep this redirect for old bookmarks and the admin tour step.
export default function EtymologyAdminRedirect() {
  redirect("/educator/etymology");
}
