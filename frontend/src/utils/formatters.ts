import { EntityCategory, EventCategory, EventType, VisibilityLevel } from "../types";

export const EVENT_TYPE_META: Record<
  EventType,
  { label: string; badgeClass: string; borderClass: string; roleLabel: string }
> = {
  canonical: {
    label: "Fato Canônico do Mundo",
    badgeClass: "bg-amber-400/20 text-amber-300 border-amber-500/40",
    borderClass: "border-amber-500/50 shadow-[4px_4px_0_#d97706]",
    roleLabel: "Mestre",
  },
  diary: {
    label: "Registro de Diário",
    badgeClass: "bg-sky-400/20 text-sky-300 border-sky-500/40",
    borderClass: "border-sky-500/50 shadow-[4px_4px_0_#0284c7]",
    roleLabel: "Jogador",
  },
  backstory: {
    label: "Antecedente / Passado",
    badgeClass: "bg-emerald-400/20 text-emerald-300 border-emerald-500/40",
    borderClass: "border-emerald-500/50 shadow-[4px_4px_0_#059669]",
    roleLabel: "Jogador",
  },
  hypothesis: {
    label: "Hipótese de Investigação",
    badgeClass: "bg-purple-400/20 text-purple-300 border-purple-500/40",
    borderClass: "border-purple-500/50 shadow-[4px_4px_0_#7c3aed]",
    roleLabel: "Jogador",
  },
};

export const ENTITY_CATEGORY_LABELS: Record<EntityCategory, string> = {
  character: "Personagem (PJ)",
  npc: "NPC",
  location: "Localidade",
  organization: "Organização",
};

export const ENTITY_STATUS_OPTIONS: Record<
  EntityCategory,
  Array<{ value: string; label: string }>
> = {
  character: [
    { value: "ativo", label: "Ativo" },
    { value: "desaparecido", label: "Desaparecido" },
    { value: "morto", label: "Morto" },
    { value: "aposentado", label: "Aposentado" },
  ],
  npc: [
    { value: "ativo", label: "Ativo" },
    { value: "desaparecido", label: "Desaparecido" },
    { value: "morto", label: "Morto" },
    { value: "desconhecido", label: "Desconhecido" },
  ],
  location: [
    { value: "ativa", label: "Ativa" },
    { value: "abandonada", label: "Abandonada" },
    { value: "destruida", label: "Destruída" },
  ],
  organization: [
    { value: "ativa", label: "Ativa" },
    { value: "inativa", label: "Inativa" },
    { value: "extinta", label: "Extinta" },
  ],
};

export const EVENT_CATEGORY_META: Record<
  EventCategory,
  { label: string; badgeClass: string; dotClass: string }
> = {
  investigacao: {
    label: "Investigação",
    badgeClass: "bg-[#FFFFFF] text-[#111111] border-[#111111]",
    dotClass: "bg-[#FF4D5A]",
  },
  descoberta: {
    label: "Descoberta",
    badgeClass: "bg-[#FF4D5A] text-[#111111] border-[#111111]",
    dotClass: "bg-[#FF4D5A]",
  },
  encontro: {
    label: "Encontro",
    badgeClass: "bg-[#EFEAE2] text-[#111111] border-[#111111]",
    dotClass: "bg-[#FFFFFF]",
  },
  revelacao: {
    label: "Revelação",
    badgeClass: "bg-[#FF4D5A] text-[#111111] border-[#111111]",
    dotClass: "bg-[#FF4D5A]",
  },
  desaparecimento: {
    label: "Desaparecimento",
    badgeClass: "bg-[#16151A] text-[#FFFFFF] border-[#111111]",
    dotClass: "bg-[#FF4D5A]",
  },
  historico: {
    label: "Histórico",
    badgeClass: "bg-[#EFEAE2] text-[#111111] border-[#111111]",
    dotClass: "bg-[#EFEAE2]",
  },
  outro: {
    label: "Outro",
    badgeClass: "bg-[#EFEAE2] text-[#111111] border-[#111111]",
    dotClass: "bg-[#EFEAE2]",
  },
};

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  public: "Público",
  private: "Privado (Mestre)",
  restricted: "Restrito",
};

export const SESSION_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  planejada: {
    label: "Planejada",
    className: "bg-[#FFFFFF] text-[#111111] border-[#111111]",
  },
  realizada: {
    label: "Realizada",
    className: "bg-[#FF4D5A] text-[#111111] border-[#111111]",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-[#EFEAE2] text-[#111111] border-[#111111]",
  },
  planned: {
    label: "Planejada",
    className: "bg-[#FFFFFF] text-[#111111] border-[#111111]",
  },
  completed: {
    label: "Realizada",
    className: "bg-[#FF4D5A] text-[#111111] border-[#111111]",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-[#EFEAE2] text-[#111111] border-[#111111]",
  },
};

export function formatRealDate(dateStr?: string | null): string {
  if (!dateStr) return "Não informada";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-");
      return `${d}/${m}/${y}`;
    }
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

export function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return "—";
  try {
    return new Date(isoStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}
