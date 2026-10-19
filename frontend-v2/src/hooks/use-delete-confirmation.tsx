"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Trash2 } from "lucide-react";

interface DeleteConfirmation {
  title: string;
  description: string;
  confirmLabel?: string;
}

export function useDeleteConfirmation() {
  const [confirmation, setConfirmation] = useState<DeleteConfirmation | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => {
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const confirmDelete = useCallback((options: DeleteConfirmation): Promise<boolean> => {
    if (resolveRef.current) return Promise.resolve(false);
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setConfirmation(options);
    });
  }, []);

  const finish = useCallback((confirmed: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setConfirmation(null);
    resolve?.(confirmed);
  }, []);

  const deleteConfirmationDialog = (
    <AlertDialog.Root open={confirmation !== null} onOpenChange={open => { if (!open) finish(false); }}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm" />
        <AlertDialog.Popup initialFocus={cancelRef} className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl outline-none">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <AlertDialog.Title className="text-lg font-semibold tracking-tight">{confirmation?.title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 break-words text-sm leading-6 text-muted-foreground">{confirmation?.description}</AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <button ref={cancelRef} type="button" onClick={() => finish(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="button" onClick={() => finish(true)} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {confirmation?.confirmLabel || "Delete"}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );

  return { confirmDelete, deleteConfirmationDialog };
}
