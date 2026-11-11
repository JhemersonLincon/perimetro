import React from "react";
import { Moon } from "lucide-react";

interface ThemeToggleButtonProps {
  className?: string;
  compactOnMobile?: boolean;
}

/**
 * Botão de alternância para o tema escuro.
 * Por definição atual do escopo, exibe o gatilho visual em todas as páginas
 * sem aplicar ainda a troca efetiva para o tema escuro.
 */
export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({
  className = "",
  compactOnMobile = false,
}) => {
  return (
    <button
      type="button"
      aria-label="Alterar para o tema escuro"
      aria-pressed={false}
      title="Alterar para o tema escuro"
      onClick={() => {
        // A alteração funcional para o tema escuro será implementada futuramente.
      }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E6E6EA] bg-white hover:bg-[#FAFAFB] hover:border-zinc-300 text-[#16151A] text-xs font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D5A]/40 ${className}`}
    >
      <Moon className="w-3.5 h-3.5 text-[#FF4D5A] shrink-0" aria-hidden="true" />
      <span className={compactOnMobile ? "hidden sm:inline" : ""}>Tema escuro</span>
    </button>
  );
};

