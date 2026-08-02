"use client";

import { useMe } from "@/lib/hooks/use-me";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Client-side gate for Studio pages whose API routes admit specific reviewer
 * roles (`elderMiddleware` / `professorMiddleware`) rather than the whole
 * reviewer pool. The surrounding `/educator` layout already guarantees the
 * visitor is an admin or a reviewer; this narrows to the page's own predicate
 * and bounces unqualified reviewers (e.g. teachers) to their Studio home —
 * mirroring how StudioShell handles a reviewer deep-linking an admin page.
 *
 * Pass the already-evaluated predicate (`undefined` while `me` is loading).
 * Returns true only once the user is confirmed qualified; render nothing and
 * keep queries disabled until then.
 */
export function useStudioRoleGate(allowed: boolean | undefined): boolean {
  const router = useRouter();

  useEffect(() => {
    if (allowed === false) router.replace("/educator");
  }, [allowed, router]);

  return allowed === true;
}
