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
  message = "Carregando registros...",
}) => (
  <div
    role="status"
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <Loader2 className="w-8 h-8 text-[#FF4D5A] animate-spin mb-3" />
    <p className="text-xs font-medium text-zinc-500">
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
    className="border border-[#E6E6EA] bg-white text-[#16151A] rounded-2xl shadow-sm p-6 flex flex-col items-center text-center max-w-lg mx-auto my-8"
  >
    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-[#FF4D5A] mb-3">
      <AlertCircle className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-[#16151A] text-lg">
      Falha ao carregar dados
    </h3>
    <p className="text-sm text-zinc-500 mt-1">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white shadow-[0_2px_10px_rgba(255,77,90,0.3)] transition-all"
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
  <div className="border border-[#E6E6EA] bg-white text-[#16151A] rounded-2xl shadow-sm p-10 flex flex-col items-center text-center">
    <div className="w-14 h-14 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] flex items-center justify-center text-[#FF4D5A] mb-4">
      {icon || <FolderOpen className="w-7 h-7" />}
    </div>
    <h3 className="text-xl font-bold tracking-tight text-[#16151A]">
      {title}
    </h3>
    <p className="text-sm text-zinc-500 mt-1.5 max-w-md">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-6 px-6 py-2.5 text-xs font-semibold rounded-2xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const VisibilityBadge: React.FC<{ visibility: VisibilityLevel }> = ({
  visibility,
}) => {
  if (visibility === "private") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        <Lock className="w-3 h-3 text-rose-500" />
        {VISIBILITY_LABELS.private}
      </span>
    );
  }
  if (visibility === "restricted") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <ShieldAlert className="w-3 h-3 text-amber-500" />
        {VISIBILITY_LABELS.restricted}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-zinc-50 text-zinc-600 border border-[#E6E6EA]">
      <Eye className="w-3 h-3 text-zinc-400" />
      {VISIBILITY_LABELS.public}
    </span>
  );
};

export const RpgSystemBadge: React.FC<{
  system: string;
  overImage?: boolean;
}> = ({ system, overImage = false }) => (
  <span
    className={`inline-flex items-center px-3.5 py-1 text-xs font-semibold rounded-full text-[#C42A3C] border border-[#FF4D5A]/20 ${
      overImage ? "bg-[#FFEDEF]/95 backdrop-blur-sm" : "bg-[#FF4D5A]/10"
    }`}
  >
    {system}
  </span>
);

export const RoleBadge: React.FC<{ role: "gm" | "player" }> = ({ role }) => {
  if (role === "gm") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA]">
        <Crown className="w-3.5 h-3.5 text-amber-500" />
        Mestre
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[#FAFAFB] text-zinc-600 border border-[#E6E6EA]">
      <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
      Jogador
    </span>
  );
};
