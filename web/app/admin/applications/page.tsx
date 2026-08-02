import { redirect } from "next/navigation";

// Reviewer applications are elder-scoped (the API gates them with
// `elderMiddleware`, which admits admins and elders), so the canonical page
// moved under the reviewer-accessible `/educator` group where the page itself
// enforces the role. Keep this redirect for old bookmarks and deep links.
export default function ApplicationsAdminRedirect() {
  redirect("/educator/applications");
}
