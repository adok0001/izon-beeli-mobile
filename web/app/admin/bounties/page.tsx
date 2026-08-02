import { redirect } from "next/navigation";

// Bounty management is professor-scoped (the API gates it with
// `professorMiddleware`, which admits admins, professors, and elders), so the
// canonical page moved under the reviewer-accessible `/educator` group where
// the page itself enforces the role. Keep this redirect for old bookmarks.
export default function BountiesAdminRedirect() {
  redirect("/educator/bounties");
}
