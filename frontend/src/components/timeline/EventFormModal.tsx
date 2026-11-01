import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { DialogModal } from "../ui/DialogModal";
import { apiRequest } from "../../services/api";
import {
  Campaign,
  CampaignMember,
  Entity,
  EventCategory,
  GameSession,
  TimelineEvent,
  VisibilityLevel,
} from "../../types";
import { EVENT_CATEGORY_META, ENTITY_CATEGORY_LABELS } from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  entities: Entity[];
  sessions: GameSession[];
  members: CampaignMember[];
  editingEvent?: TimelineEvent | null;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  campaign,
  entities,
  sessions,
  members,
  editingEvent,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const months = campaign.calendar_config?.months || [{ name: "Janeiro", days: 31 }];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("investigacao");
  const [dateIsUnknown, setDateIsUnknown] = useState(false);
  const [narrativeYear, setNarrativeYear] = useState<number>(
    campaign.calendar_config?.type === "fictional" ? 412 : 1928
  );
  const [narrativeMonth, setNarrativeMonth] = useState<number>(1);
  const [narrativeDay, setNarrativeDay] = useState<number>(1);
  const [narrativeTime, setNarrativeTime] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [visibility, setVisibility] = useState<VisibilityLevel>("public");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description);
      setCategory(editingEvent.category);
      setDateIsUnknown(editingEvent.date_is_unknown);
      setNarrativeYear(
        editingEvent.narrative_year ??
          (campaign.calendar_config?.type === "fictional" ? 412 : 1928)
      );
      setNarrativeMonth(editingEvent.narrative_month ?? 1);
      setNarrativeDay(editingEvent.narrative_day ?? 1);
      setNarrativeTime(editingEvent.narrative_time || "");
      setSessionId(editingEvent.session_id || "");
      setVisibility(editingEvent.visibility);
      setSelectedEntityIds(editingEvent.entities.map((e) => e.id));
      setAllowedUserIds(editingEvent.allowed_user_ids || []);
    } else {
      setTitle("");
      setDescription("");
      setCategory("investigacao");
      setDateIsUnknown(false);
      setNarrativeYear(campaign.calendar_config?.type === "fictional" ? 412 : 1928);
      setNarrativeMonth(1);
      setNarrativeDay(1);
      setNarrativeTime("");
      setSessionId("");
      setVisibility("public");
      setSelectedEntityIds([]);
      setAllowedUserIds([]);
    }
    setFormError(null);
  }, [editingEvent, isOpen, campaign]);

  const toggleEntity = (id: string) => {
    setSelectedEntityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllowedUser = (userId: string) => {
    setAllowedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error("Informe o título do acontecimento.");
      }
      if (!description.trim()) {
        throw new Error("Informe a descrição completa do acontecimento.");
      }
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        date_is_unknown: dateIsUnknown,
        calendar_type: campaign.calendar_config?.type || "gregorian",
        narrative_year: dateIsUnknown ? null : Number(narrativeYear),
        narrative_month: dateIsUnknown ? null : Number(narrativeMonth),
        narrative_day: dateIsUnknown ? null : Number(narrativeDay),
        narrative_time: dateIsUnknown ? null : narrativeTime.trim() || null,
        session_id: sessionId || null,
        visibility,
        entity_ids: selectedEntityIds,
        allowed_user_ids: visibility === "restricted" ? allowedUserIds : [],
      };

      if (editingEvent) {
        return apiRequest<TimelineEvent>(`/events/${editingEvent.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return apiRequest<TimelineEvent>(`/campaigns/${campaign.id}/events`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      if (editingEvent) {
        queryClient.invalidateQueries({ queryKey: ["event", editingEvent.id] });
      }
      showToast(
        editingEvent
          ? "Acontecimento atualizado com sucesso!"
          : "Acontecimento registrado na linha do tempo!",
        "success"
      );
      onClose();
    },
    onError: (err: any) => {
      setFormError(err.message || "Falha ao salvar acontecimento.");
    },
  });

  const maxDaysInSelectedMonth =
    months[Math.max(0, Math.min(months.length - 1, narrativeMonth - 1))]?.days || 31;

  const groupedEntities = {
    character: entities.filter((e) => e.category === "character"),
    npc: entities.filter((e) => e.category === "npc"),
    location: entities.filter((e) => e.category === "location"),
    organization: entities.filter((e) => e.category === "organization"),
  };

  const playerMembers = members.filter((m) => m.role === "player");

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEvent ? "Editar Acontecimento" : "Registrar Novo Acontecimento"}
      subtitle="Conecte fatos cronológicos a personagens, NPCs, localidades, organizações e sessões."
      maxWidthClass="max-w-3xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-5"
      >
        {formError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200"
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="evt-title"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Título do Acontecimento <span className="text-amber-400">*</span>
            </label>
            <input
              id="evt-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Abertura do Cofre Subterrâneo"
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="evt-category"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Categoria <span className="text-amber-400">*</span>
            </label>
            <select
              id="evt-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            >
              {(Object.keys(EVENT_CATEGORY_META) as EventCategory[]).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {EVENT_CATEGORY_META[catKey].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Narrativa */}
        <div className="p-4 rounded-xl bg-obsidian-950 border border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-amber-400">
              Data Narrativa ({campaign.calendar_config?.type === "fictional" ? "Calendário Fictício" : "Calendário Gregoriano"})
            </span>

            <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={dateIsUnknown}
                onChange={(e) => setDateIsUnknown(e.target.checked)}
                className="rounded border-zinc-700"
              />
              Data exata desconhecida / indefinida
            </label>
          </div>

          {!dateIsUnknown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="evt-day"
                  className="block text-[11px] font-mono uppercase text-zinc-400 mb-1"
                >
                  Dia (1–{maxDaysInSelectedMonth})
                </label>
                <input
                  id="evt-day"
                  type="number"
                  min={1}
                  max={maxDaysInSelectedMonth}
                  value={narrativeDay}
                  onChange={(e) => setNarrativeDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-zinc-800 text-zinc-100 text-sm font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="evt-month"
                  className="block text-[11px] font-mono uppercase text-zinc-400 mb-1"
                >
                  Mês
                </label>
                <select
                  id="evt-month"
                  value={narrativeMonth}
                  onChange={(e) => setNarrativeMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-zinc-800 text-zinc-100 text-sm"
                >
                  {months.map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      {idx + 1}. {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="evt-year"
                  className="block text-[11px] font-mono uppercase text-zinc-400 mb-1"
                >
                  Ano ({campaign.calendar_config?.era_name || "d.C."})
                </label>
                <input
                  id="evt-year"
                  type="number"
                  value={narrativeYear}
                  onChange={(e) => setNarrativeYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-zinc-800 text-zinc-100 text-sm font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="evt-time"
                  className="block text-[11px] font-mono uppercase text-zinc-400 mb-1"
                >
                  Horário (Opcional)
                </label>
                <input
                  id="evt-time"
                  type="text"
                  placeholder="Ex: 22:30 ou Madrugada"
                  value={narrativeTime}
                  onChange={(e) => setNarrativeTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-zinc-800 text-zinc-100 text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Descrição completa */}
        <div>
          <label
            htmlFor="evt-description"
            className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
          >
            Descrição Completa <span className="text-amber-400">*</span>
          </label>
          <p className="text-[11px] text-zinc-500 mb-2">
            Suporta parágrafos, listas iniciadas por <code>- </code> e destaques com{" "}
            <code>**texto**</code>.
          </p>
          <textarea
            id="evt-description"
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os detalhes do acontecimento, pistas encontradas e consequências narrativas..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 leading-relaxed"
          />
        </div>

        {/* Sessão Associada e Visibilidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="evt-session"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Sessão Associada (Opcional)
            </label>
            <select
              id="evt-session"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">Sem sessão vinculada (Evento histórico / Entre sessões)</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Sessão #{String(s.session_number).padStart(2, "0")} — {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="evt-visibility"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Nível de Visibilidade <span className="text-amber-400">*</span>
            </label>
            <select
              id="evt-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="public">Público (Todos os participantes)</option>
              <option value="private">Privado (Somente o Mestre)</option>
              <option value="restricted">Restrito (Jogadores selecionados)</option>
            </select>
          </div>
        </div>

        {visibility === "restricted" && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-300">
              Jogadores Autorizados a Visualizar este Registro
            </div>
            {playerMembers.length === 0 ? (
              <p className="text-xs text-zinc-400">
                Ainda não há jogadores na campanha. Apenas o Mestre verá este registro por enquanto.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {playerMembers.map((pm) => {
                  const checked = allowedUserIds.includes(pm.user_id);
                  return (
                    <label
                      key={pm.user_id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        checked
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                          : "bg-obsidian-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAllowedUser(pm.user_id)}
                      />
                      <span>
                        {pm.user.name} (@{pm.user.username})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Entidades Relacionadas por Categoria */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-300">
            Entidades Relacionadas ({selectedEntityIds.length} selecionadas)
          </div>

          {entities.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Nenhuma entidade cadastrada na campanha até o momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["character", "npc", "location", "organization"] as const).map((catKey) => {
                const list = groupedEntities[catKey];
                return (
                  <div
                    key={catKey}
                    className="p-3 rounded-xl bg-obsidian-950 border border-zinc-800/80"
                  >
                    <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 mb-2">
                      {ENTITY_CATEGORY_LABELS[catKey]} ({list.length})
                    </div>
                    {list.length === 0 ? (
                      <p className="text-xs text-zinc-600">Nenhum registro nesta categoria.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {list.map((ent) => {
                          const isSelected = selectedEntityIds.includes(ent.id);
                          return (
                            <button
                              key={ent.id}
                              type="button"
                              onClick={() => toggleEntity(ent.id)}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                                isSelected
                                  ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                                  : "bg-obsidian-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {ent.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending
              ? "Salvando..."
              : editingEvent
              ? "Salvar Alterações"
              : "Registrar Acontecimento"}
          </button>
        </div>
      </form>
    </DialogModal>
  );
};
