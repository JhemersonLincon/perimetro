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
