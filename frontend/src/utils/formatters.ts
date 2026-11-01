import { EntityCategory, EventCategory, VisibilityLevel } from "../types";

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
    badgeClass: "bg-[#fffdf4] text-[#172e28] border-[#172e28]",
    dotClass: "bg-[#d8ff72]",
  },
  descoberta: {
    label: "Descoberta",
    badgeClass: "bg-[#d8ff72] text-[#172e28] border-[#172e28]",
    dotClass: "bg-[#d8ff72]",
  },
  encontro: {
    label: "Encontro",
    badgeClass: "bg-[#f6f1e4] text-[#172e28] border-[#172e28]",
    dotClass: "bg-[#fffdf4]",
  },
  revelacao: {
    label: "Revelação",
    badgeClass: "bg-[#ffd2bb] text-[#172e28] border-[#172e28]",
    dotClass: "bg-[#fa775d]",
  },
  desaparecimento: {
    label: "Desaparecimento",
    badgeClass: "bg-[#fa775d] text-[#172e28] border-[#172e28]",
    dotClass: "bg-[#fa775d]",
  },
  historico: {
    label: "Histórico",
    badgeClass: "bg-[#ffd2bb] text-[#172e28] border-[#172e28]",
    dotClass: "bg-[#ffd2bb]",
  },
  outro: {
    label: "Outro",
    badgeClass: "bg-[#f6f1e4] text-[#172e28] border-[#172e28]",
    dotClass: "bg-[#f6f1e4]",
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
    className: "bg-[#fffdf4] text-[#172e28] border-[#172e28]",
  },
  realizada: {
    label: "Realizada",
    className: "bg-[#d8ff72] text-[#172e28] border-[#172e28]",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-[#fa775d] text-[#172e28] border-[#172e28]",
  },
  planned: {
    label: "Planejada",
    className: "bg-[#fffdf4] text-[#172e28] border-[#172e28]",
  },
  completed: {
    label: "Realizada",
    className: "bg-[#d8ff72] text-[#172e28] border-[#172e28]",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-[#fa775d] text-[#172e28] border-[#172e28]",
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
