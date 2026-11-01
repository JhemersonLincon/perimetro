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
    <Loader2 className="w-8 h-8 text-[#FF4D5A] animate-spin mb-3" />
    <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF4D5A]">
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
    className="border-2 border-[#111111] bg-[#FFFFFF] text-[#111111] shadow-[6px_6px_0_#111111] p-6 flex flex-col items-center text-center max-w-lg mx-auto my-8"
  >
    <AlertCircle className="w-8 h-8 text-[#FF4D5A] mb-3" />
    <h3 className="font-display font-bold uppercase text-[#111111] text-lg">
      Falha ao carregar dados
    </h3>
    <p className="text-sm text-[#111111]/90 mt-1">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-[#FF4D5A] text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0_#111111]"
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
  <div className="border-2 border-[#111111] bg-[#FFFFFF] text-[#111111] shadow-[8px_8px_0_#111111] p-10 flex flex-col items-center text-center">
    <div className="w-12 h-12 bg-[#FF4D5A] border-2 border-[#111111] shadow-[3px_3px_0_#111111] flex items-center justify-center text-[#111111] mb-4">
      {icon || <FolderOpen className="w-6 h-6" />}
    </div>
    <h3 className="font-display text-xl font-bold uppercase tracking-[-0.04em] text-[#111111]">
      {title}
    </h3>
    <p className="text-sm text-[#111111]/80 mt-1.5 max-w-md">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-6 px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#FF4D5A] hover:bg-[#e63946] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0_#111111] transition-all"
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
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold uppercase border border-[#111111] bg-[#FF4D5A] text-[#111111]">
        <Lock className="w-3 h-3" />
        {VISIBILITY_LABELS.private}
      </span>
    );
  }
  if (visibility === "restricted") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold uppercase border border-[#111111] bg-[#EFEAE2] text-[#111111]">
        <ShieldAlert className="w-3 h-3" />
        {VISIBILITY_LABELS.restricted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold uppercase border border-[#111111] bg-[#FFFFFF] text-[#111111]">
      <Eye className="w-3 h-3" />
      {VISIBILITY_LABELS.public}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: "gm" | "player" }> = ({ role }) => {
  if (role === "gm") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#16151A] text-[#FFFFFF] border border-[#111111]">
        <Crown className="w-3.5 h-3.5 text-[#FF4D5A]" />
        Mestre (GM)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#FFFFFF] text-[#111111] border border-[#111111]">
      <UserCheck className="w-3.5 h-3.5 text-[#FF4D5A]" />
      Jogador
    </span>
  );
};
