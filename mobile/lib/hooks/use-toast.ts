import { useCallback, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastState {
  visible: boolean;
  title: string;
  body: string;
  type: ToastType;
}

const HIDDEN: ToastState = { visible: false, title: "", body: "", type: "info" };

export function useToast() {
  const [toast, setToast] = useState<ToastState>(HIDDEN);

  const show = useCallback((title: string, body = "", type: ToastType = "info") => {
    setToast({ visible: true, title, body, type });
  }, []);

  const success = useCallback((title: string, body = "") => show(title, body, "success"), [show]);
  const error = useCallback((title: string, body = "") => show(title, body, "error"), [show]);
  const warning = useCallback((title: string, body = "") => show(title, body, "warning"), [show]);
  const dismiss = useCallback(() => setToast(HIDDEN), []);

  return { toast, show, success, error, warning, dismiss };
}
