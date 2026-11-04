import React, { useEffect, useId, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Diálogo de confirmação para operações destrutivas utilizando <dialog> nativo
 * e <form method="dialog"> com autofocus na opção segura (Cancelar), conforme
 * diretrizes do modern-web-guidance (guide: dialog).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar Exclusão",
  cancelLabel = "Cancelar",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      const action = dialog.returnValue;
      dialog.returnValue = "";
      if (action === "confirm") {
        onConfirm();
      } else {
        onCancel();
      }
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-full max-w-md rounded-2xl bg-white border border-[#E6E6EA] text-[#16151A] shadow-2xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-[#16151A]">
            {title}
          </h2>
          <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <form method="dialog" className="mt-6 flex items-center justify-end gap-3">
        <button
          type="submit"
          value="cancel"
          autoFocus
          disabled={isLoading}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-700 border border-[#E6E6EA] transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          value="confirm"
          disabled={isLoading}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF4D5A] hover:bg-[#ff3b49] text-white shadow-[0_2px_8px_rgba(255,77,90,0.3)] transition-colors disabled:opacity-50"
        >
          {isLoading ? "Processando..." : confirmLabel}
        </button>
      </form>
    </dialog>
  );
};
