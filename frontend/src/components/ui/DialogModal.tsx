import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface DialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

/**
 * Componente de diálogo modal construído sobre o elemento nativo <dialog>
 * seguindo as diretrizes do modern-web-guidance (guide: dialog):
 * - Abertura imperativa com showModal() (sem adicionar role="dialog" ou aria-modal manualmente)
 * - Nome acessível via aria-labelledby apontando para o cabeçalho
 * - Suporte a closedby="any" com fallback de pointerdown/pointerup fora do retângulo do diálogo
 */
export const DialogModal: React.FC<DialogModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = "max-w-2xl",
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const isOutside = (e: React.PointerEvent<HTMLDialogElement>, dialog: HTMLDialogElement) => {
    const r = dialog.getBoundingClientRect();
    return (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    );
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: "any" } as any)}
      onPointerDown={(e) => {
        if (dialogRef.current) {
          pressedOutsideRef.current = isOutside(e, dialogRef.current);
        }
      }}
      onPointerUp={(e) => {
        if (
          dialogRef.current &&
          !("closedBy" in HTMLDialogElement.prototype) &&
          pressedOutsideRef.current &&
          isOutside(e, dialogRef.current)
        ) {
          dialogRef.current.close();
        }
      }}
      className={`w-full ${maxWidthClass} rounded-xl bg-obsidian-900 border border-zinc-800 text-zinc-100 shadow-2xl p-0 open:flex open:flex-col max-h-[90vh]`}
    >
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-zinc-800/80 shrink-0">
        <div>
          <h2 id={titleId} className="font-display text-lg font-semibold text-zinc-100">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Fechar janela"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto">{children}</div>
    </dialog>
  );
};
