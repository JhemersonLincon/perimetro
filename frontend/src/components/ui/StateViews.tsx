import React from "react";
import {
  AlertCircle,
  Eye,
  Lock,
  ShieldAlert,
  Loader2,
  FolderOpen,
  Crown,
  UserCheck,
} from "lucide-react";
import { VisibilityLevel } from "../../types";
import { VISIBILITY_LABELS } from "../../utils/formatters";

export const LoadingState: React.FC<{ message?: string }> = ({
  message = "Carregando registros do arquivo...",
}) => (
  <div
    role="status"
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <Loader2 className="w-8 h-8 text-[#d8ff72] animate-spin mb-3" />
    <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#d8ff72]">
      {message}
    </p>
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="border-2 border-[#172e28] bg-[#ffd2bb] text-[#172e28] shadow-[6px_6px_0_#172e28] p-6 flex flex-col items-center text-center max-w-lg mx-auto my-8"
  >
    <AlertCircle className="w-8 h-8 text-[#fa775d] mb-3" />
    <h3 className="font-display font-bold uppercase text-[#172e28] text-lg">
      Falha ao carregar dados
    </h3>
    <p className="text-sm text-[#172e28]/90 mt-1">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-[#fa775d] text-[#172e28] border-2 border-[#172e28] shadow-[3px_3px_0_#172e28]"
      >
        Tentar Novamente
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionLabel, onAction, icon }) => (
  <div className="border-2 border-[#172e28] bg-[#fffdf4] text-[#172e28] shadow-[8px_8px_0_#172e28] p-10 flex flex-col items-center text-center">
    <div className="w-12 h-12 bg-[#d8ff72] border-2 border-[#172e28] shadow-[3px_3px_0_#172e28] flex items-center justify-center text-[#172e28] mb-4">
      {icon || <FolderOpen className="w-6 h-6" />}
    </div>
    <h3 className="font-display text-xl font-bold uppercase tracking-[-0.04em] text-[#172e28]">
      {title}
    </h3>
    <p className="text-sm text-[#172e28]/80 mt-1.5 max-w-md">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-6 px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#d8ff72] hover:bg-[#c8f550] text-[#172e28] border-2 border-[#172e28] shadow-[4px_4px_0_#172e28] transition-all"
      >
        {actionLabel} ↗
      </button>
    )}
  </div>
);

export const VisibilityBadge: React.FC<{ visibility: VisibilityLevel }> = ({
  visibility,
}) => {
  if (visibility === "private") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold uppercase border border-[#172e28] bg-[#fa775d] text-[#172e28]">
        <Lock className="w-3 h-3" />
        {VISIBILITY_LABELS.private}
      </span>
    );
  }
  if (visibility === "restricted") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold uppercase border border-[#172e28] bg-[#ffd2bb] text-[#172e28]">
        <ShieldAlert className="w-3 h-3" />
        {VISIBILITY_LABELS.restricted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold uppercase border border-[#172e28] bg-[#d8ff72] text-[#172e28]">
      <Eye className="w-3 h-3" />
      {VISIBILITY_LABELS.public}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: "gm" | "player" }> = ({ role }) => {
  if (role === "gm") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#d8ff72] text-[#172e28] border border-[#172e28]">
        <Crown className="w-3.5 h-3.5 text-[#172e28]" />
        Mestre (GM)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#fffdf4] text-[#172e28] border border-[#172e28]">
      <UserCheck className="w-3.5 h-3.5 text-[#fa775d]" />
      Jogador
    </span>
  );
};
