"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/action-result";

/** Shows a toast whenever a server action returns a new result. */
export function useActionFeedback(state: ActionResult, onSuccess?: () => void) {
  const t = useTranslations();
  const last = useRef<ActionResult>(undefined);

  useEffect(() => {
    if (!state || state === last.current) return;
    last.current = state;
    if (state.ok) {
      if (state.message) toast.success(t(state.message, state.values));
      onSuccess?.();
    } else {
      toast.error(t(state.error, state.values));
    }
  }, [state, t, onSuccess]);
}
