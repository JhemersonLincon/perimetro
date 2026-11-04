import { EntityCategory, EventCategory, EventType, VisibilityLevel } from "../types";

export const EVENT_TYPE_META: Record<
  EventType,
  { label: string; badgeClass: string; borderClass: string; roleLabel: string }
> = {
  canonical: {
    label: "Fato Canônico do Mundo",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    borderClass: "border-amber-300 ring-1 ring-amber-200/50 shadow-sm",
    roleLabel: "Mestre",
  },
  diary: {
    label: "Registro de Diário",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    borderClass: "border-sky-200 hover:border-sky-300 shadow-sm",
    roleLabel: "Jogador",
  },
  backstory: {
    label: "Antecedente / Passado",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    borderClass: "border-emerald-200 hover:border-emerald-300 shadow-sm",
    roleLabel: "Jogador",
  },
  hypothesis: {
    label: "Hipótese de Investigação",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    borderClass: "border-purple-200 hover:border-purple-300 shadow-sm",
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
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    dotClass: "bg-[#FF4D5A]",
  },
  descoberta: {
    label: "Descoberta",
    badgeClass: "bg-[#FF4D5A]/10 text-[#C42A3C] border-[#FF4D5A]/20",
    dotClass: "bg-[#FF4D5A]",
  },
  encontro: {
    label: "Encontro",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
  },
  revelacao: {
    label: "Revelação",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  desaparecimento: {
    label: "Desaparecimento",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    dotClass: "bg-purple-500",
  },
  historico: {
    label: "Histórico",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    dotClass: "bg-zinc-400",
  },
  outro: {
    label: "Outro",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    dotClass: "bg-zinc-400",
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
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  realizada: {
    label: "Realizada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  planned: {
    label: "Planejada",
    className: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  completed: {
    label: "Realizada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-rose-50 text-rose-700 border-rose-200",
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
