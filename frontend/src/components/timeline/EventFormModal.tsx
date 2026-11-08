import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Calendar, Clock, Crown, BookOpen, Scroll, HelpCircle } from "lucide-react";
import { DialogModal } from "../ui/DialogModal";
import { apiRequest } from "../../services/api";
import {
  Campaign,
  CampaignMember,
  Entity,
  EventCategory,
  EventType,
  GameSession,
  TimelineEvent,
  VisibilityLevel,
} from "../../types";
import { EVENT_CATEGORY_META, ENTITY_CATEGORY_LABELS, EVENT_TYPE_META } from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  entities: Entity[];
  sessions: GameSession[];
  members: CampaignMember[];
  isGM?: boolean;
  editingEvent?: TimelineEvent | null;
  initialDate?: { year?: number; month?: number | null; day?: number | null } | null;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  campaign,
  entities,
  sessions,
  members,
  isGM = false,
  editingEvent,
  initialDate,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const months = campaign.calendar_config?.months || [{ name: "Janeiro", days: 31 }];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("investigacao");
  const [eventType, setEventType] = useState<EventType>(isGM ? "canonical" : "diary");
  const [dateIsUnknown, setDateIsUnknown] = useState(false);

  // Granularidade Temporal
  const [year, setYear] = useState<number>(
    campaign.calendar_config?.type === "fictional" ? 412 : 1924
  );
  const [hasMonth, setHasMonth] = useState<boolean>(true);
  const [month, setMonth] = useState<number>(1);
  const [hasDay, setHasDay] = useState<boolean>(true);
  const [day, setDay] = useState<number>(1);
  const [timeLabel, setTimeLabel] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(0);

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
      setEventType(editingEvent.event_type || (isGM ? "canonical" : "diary"));
      setDateIsUnknown(editingEvent.date_is_unknown);

      const evtYear = editingEvent.year ?? editingEvent.narrative_year ?? (campaign.calendar_config?.type === "fictional" ? 412 : 1924);
      setYear(evtYear);

      const evtMonth = editingEvent.month ?? editingEvent.narrative_month;
      if (evtMonth !== null && evtMonth !== undefined) {
        setHasMonth(true);
        setMonth(evtMonth);
      } else {
        setHasMonth(false);
        setMonth(1);
      }

      const evtDay = editingEvent.day ?? editingEvent.narrative_day;
      if (evtDay !== null && evtDay !== undefined) {
        setHasDay(true);
        setDay(evtDay);
      } else {
        setHasDay(false);
        setDay(1);
      }

      setTimeLabel(editingEvent.time_label ?? editingEvent.narrative_time ?? "");
      setSortOrder(editingEvent.sort_order ?? 0);
      setSessionId(editingEvent.session_id || "");
      setVisibility(editingEvent.visibility);
      setSelectedEntityIds(editingEvent.entities.map((e) => e.id));
      setAllowedUserIds(editingEvent.allowed_user_ids || []);
    } else {
      setTitle("");
      setDescription("");
      setCategory("investigacao");
      setEventType(isGM ? "canonical" : "diary");
      setDateIsUnknown(false);

      const initialYr = initialDate?.year ?? (campaign.calendar_config?.type === "fictional" ? 412 : 1924);
      setYear(initialYr);

      if (initialDate?.month !== undefined && initialDate?.month !== null) {
        setHasMonth(true);
        setMonth(initialDate.month);
      } else if (initialDate?.year !== undefined && initialDate?.month === null) {
        setHasMonth(false);
        setMonth(1);
      } else {
        setHasMonth(true);
        setMonth(1);
      }

      if (initialDate?.day !== undefined && initialDate?.day !== null) {
        setHasDay(true);
        setDay(initialDate.day);
      } else if (initialDate?.month !== undefined && initialDate?.day === null) {
        setHasDay(false);
        setDay(1);
      } else {
        setHasDay(true);
        setDay(1);
      }

      setTimeLabel("");
      setSortOrder(0);
      setSessionId("");
      setVisibility("public");
      setSelectedEntityIds([]);
      setAllowedUserIds([]);
    }
    setFormError(null);
  }, [editingEvent, isOpen, campaign, initialDate, isGM]);

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
      if (!dateIsUnknown && (year === null || isNaN(year))) {
        throw new Error("Informe o ano do acontecimento.");
      }

      const effectiveMonth = dateIsUnknown || !hasMonth ? null : Number(month);
      const effectiveDay = dateIsUnknown || !hasMonth || !hasDay ? null : Number(day);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        event_type: eventType,
        date_is_unknown: dateIsUnknown,
        calendar_type: campaign.calendar_config?.type || "gregorian",
        year: dateIsUnknown ? null : Number(year),
        month: effectiveMonth,
        day: effectiveDay,
        time_label: dateIsUnknown ? null : timeLabel.trim() || null,
        sort_order: Number(sortOrder) || 0.0,
        narrative_year: dateIsUnknown ? null : Number(year),
        narrative_month: effectiveMonth,
        narrative_day: effectiveDay,
        narrative_time: dateIsUnknown ? null : timeLabel.trim() || null,
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
      queryClient.invalidateQueries({ queryKey: ["timeline-tree", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      if (editingEvent) {
        queryClient.invalidateQueries({ queryKey: ["event", editingEvent.id] });
      }
      showToast(
        editingEvent
          ? "Acontecimento atualizado com sucesso!"
          : "Acontecimento registrado na linha do tempo compartilhada!",
        "success"
      );
      onClose();
    },
    onError: (err: any) => {
      setFormError(err.message || "Falha ao salvar acontecimento.");
    },
  });

  const maxDaysInSelectedMonth =
    months[Math.max(0, Math.min(months.length - 1, (month || 1) - 1))]?.days || 31;

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
      title={editingEvent ? "Editar Acontecimento" : "Novo Acontecimento na Linha do Tempo"}
      subtitle="Colabore no eixo cronológico com precisão flexível de ano, mês, dia e momento."
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
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
          >
            {formError}
          </div>
        )}

        {/* Título e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="evt-title"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            />
          </div>

          <div>
            <label
              htmlFor="evt-category"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Categoria <span className="text-amber-400">*</span>
            </label>
            <select
              id="evt-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            >
              {(Object.keys(EVENT_CATEGORY_META) as EventCategory[]).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {EVENT_CATEGORY_META[catKey].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tipo de Registro e Autoria Colaborativa */}
        <div className="p-4 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Tipo de Registro Colaborativo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {isGM && (
              <button
                type="button"
                onClick={() => setEventType("canonical")}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  eventType === "canonical"
                    ? "bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-200"
                    : "bg-white border-[#E6E6EA] text-zinc-600 hover:border-zinc-300 shadow-sm"
                }`}
              >
                <Crown className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <div className="text-xs font-bold">Fato Canônico</div>
                  <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">História oficial do mundo</div>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => setEventType("diary")}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                eventType === "diary"
                  ? "bg-sky-50 border-sky-300 text-sky-900 ring-2 ring-sky-200"
                  : "bg-white border-[#E6E6EA] text-zinc-600 hover:border-zinc-300 shadow-sm"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
              <div>
                <div className="text-xs font-bold">Registro de Diário</div>
                <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">Notas do personagem</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEventType("backstory")}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                eventType === "backstory"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-200"
                  : "bg-white border-[#E6E6EA] text-zinc-600 hover:border-zinc-300 shadow-sm"
              }`}
            >
              <Scroll className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <div className="text-xs font-bold">Antecedente</div>
                <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">Passado e memórias</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEventType("hypothesis")}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                eventType === "hypothesis"
                  ? "bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-200"
                  : "bg-white border-[#E6E6EA] text-zinc-600 hover:border-zinc-300 shadow-sm"
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-purple-600" />
              <div>
                <div className="text-xs font-bold">Hipótese / Teoria</div>
                <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">Dedução investigativa</div>
              </div>
            </button>
          </div>
        </div>

        {/* Granularidade Temporal Flexível */}
        <div className="p-4 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#16151A] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF4D5A]" />
              Eixo Temporal Granular ({campaign.calendar_config?.type === "fictional" ? "Calendário Fictício" : "Calendário Gregoriano"})
            </span>

            <label className="inline-flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={dateIsUnknown}
                onChange={(e) => setDateIsUnknown(e.target.checked)}
                className="rounded border-[#E6E6EA] text-[#FF4D5A] focus:ring-0"
              />
              Data exata desconhecida / indefinida
            </label>
          </div>

          {!dateIsUnknown && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Ano (Obrigatório, suporta valores negativos) */}
                <div>
                  <label
                    htmlFor="evt-year"
                    className="block text-[11px] font-semibold text-zinc-600 mb-1"
                  >
                    Ano <span className="text-[#FF4D5A]">*</span> (Ex: 1924 ou -450 a.C.)
                  </label>
                  <input
                    id="evt-year"
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
                  />
                </div>

                {/* Mês (Opcional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="evt-month"
                      className="block text-[11px] font-semibold text-zinc-600"
                    >
                      Mês (Opcional)
                    </label>
                    <label className="text-[10px] text-zinc-500 inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hasMonth}
                        onChange={(e) => {
                          setHasMonth(!e.target.checked);
                          if (e.target.checked) setHasDay(false);
                        }}
                        className="rounded border-[#E6E6EA]"
                      />
                      Sem mês (Geral do Ano)
                    </label>
                  </div>
                  <select
                    id="evt-month"
                    disabled={!hasMonth}
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm transition-colors ${
                      hasMonth
                        ? "bg-white border-[#E6E6EA] text-[#16151A] focus:outline-none focus:border-[#FF4D5A]"
                        : "bg-zinc-100 border-[#E6E6EA] text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    {months.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {idx + 1}. {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dia (Opcional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="evt-day"
                      className="block text-[11px] font-semibold text-zinc-600"
                    >
                      Dia (Opcional, 1–{maxDaysInSelectedMonth})
                    </label>
                    <label className="text-[10px] text-zinc-500 inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!hasMonth}
                        checked={!hasDay || !hasMonth}
                        onChange={(e) => setHasDay(!e.target.checked)}
                        className="rounded border-[#E6E6EA]"
                      />
                      Sem dia (Geral do Mês)
                    </label>
                  </div>
                  <input
                    id="evt-day"
                    type="number"
                    min={1}
                    max={maxDaysInSelectedMonth}
                    disabled={!hasMonth || !hasDay}
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border text-sm transition-colors ${
                      hasMonth && hasDay
                        ? "bg-white border-[#E6E6EA] text-[#16151A] focus:outline-none focus:border-[#FF4D5A]"
                        : "bg-zinc-100 border-[#E6E6EA] text-zinc-400 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>

              {/* Precisão no Dia e Desempate Manual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E6E6EA]">
                <div>
                  <label
                    htmlFor="evt-time"
                    className="block text-[11px] font-semibold text-zinc-600 mb-1 flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3 text-[#FF4D5A]" />
                    Momento / Horário (Opcional)
                  </label>
                  <input
                    id="evt-time"
                    type="text"
                    placeholder="Ex: Madrugada, 14h30, Pôr do sol"
                    value={timeLabel}
                    onChange={(e) => setTimeLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="evt-sort-order"
                    className="block text-[11px] font-semibold text-zinc-600 mb-1"
                  >
                    Desempate Cronológico (sort_order)
                  </label>
                  <input
                    id="evt-sort-order"
                    type="number"
                    step="0.5"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
                  />
                  <span className="text-[10px] text-zinc-500">
                    Menores valores aparecem primeiro quando na mesma data/hora.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Descrição completa */}
        <div>
          <label
            htmlFor="evt-description"
            className="block text-xs font-semibold text-zinc-700 mb-1.5"
          >
            Descrição Completa <span className="text-amber-400">*</span>
          </label>
          <p className="text-[11px] text-zinc-500 mb-2">
            Suporta parágrafos, listas iniciadas por <code>- </code> e destaques com <code>**texto**</code>.
          </p>
          <textarea
            id="evt-description"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os acontecimentos, pistas descobertas ou fatos narrados..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A] leading-relaxed"
          />
        </div>

        {/* Vínculo com Sessão e Visibilidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="evt-session"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Vincular à Sessão de Jogo (Opcional)
            </label>
            <select
              id="evt-session"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            >
              <option value="">Nenhuma Sessão</option>
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
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Nível de Sigilo / Visibilidade
            </label>
            <select
              id="evt-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            >
              <option value="public">Público (Visível para toda a mesa)</option>
              <option value="restricted">Restrito (Permissão de descoberta a jogadores específicos)</option>
              <option value="private">{isGM ? "Privado do Mestre (Segredo Oculto)" : "Privado (Visível apenas para você e o Mestre)"}</option>
            </select>
          </div>
        </div>

        {/* Jogadores autorizados se restrito */}
        {visibility === "restricted" && (
          <div className="p-4 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] space-y-2">
            <span className="text-xs font-semibold text-[#16151A]">
              Jogadores com Acesso a este Acontecimento
            </span>
            {playerMembers.length === 0 ? (
              <p className="text-xs text-zinc-500">Nenhum jogador na campanha ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {playerMembers.map((m) => {
                  const selected = allowedUserIds.includes(m.user_id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAllowedUser(m.user_id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                        selected
                          ? "bg-[#FF4D5A]/10 text-[#C42A3C] border-[#FF4D5A]/30 font-semibold"
                          : "bg-white text-zinc-600 border-[#E6E6EA] hover:border-zinc-300"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {m.user.name} ({m.user.username})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Conexões com Entidades */}
        {entities.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#E6E6EA]">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">
              Conectar Entidades do Mundo
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(["character", "npc", "location", "organization"] as const).map((cat) => {
                const list = groupedEntities[cat];
                if (list.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">
                      {ENTITY_CATEGORY_LABELS[cat]}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((ent) => {
                        const sel = selectedEntityIds.includes(ent.id);
                        return (
                          <button
                            key={ent.id}
                            type="button"
                            onClick={() => toggleEntity(ent.id)}
                            className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                              sel
                                ? "bg-[#FF4D5A]/10 text-[#C42A3C] border-[#FF4D5A]/30 font-semibold"
                                : "bg-white text-zinc-600 border-[#E6E6EA] hover:border-zinc-300"
                            }`}
                          >
                            {sel ? "✓ " : "+ "}
                            {ent.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E6EA]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white font-semibold text-xs shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? "Salvando..." : editingEvent ? "Salvar Alterações" : "Registrar Acontecimento"}
          </button>
        </div>
      </form>
    </DialogModal>
  );
};
