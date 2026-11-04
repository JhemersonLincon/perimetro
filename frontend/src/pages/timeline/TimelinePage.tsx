import React, { useState, useEffect, useMemo } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Edit3,
  Trash2,
  ExternalLink,
  Layers,
  ZoomIn,
  ZoomOut,
  Lock,
  Eye,
  Crown,
  Scroll,
  User as UserIcon,
  ChevronRight,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import {
  CampaignMember,
  Entity,
  EventCategory,
  GameSession,
  PaginatedEntities,
  PaginatedEvents,
  PaginatedSessions,
  TimelineDayGroup,
  TimelineEvent,
  TimelineMonthGroup,
  TimelineYearGroup,
  TimelineZoomLevel,
} from "../../types";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EventFormModal } from "../../components/timeline/EventFormModal";
import { EVENT_CATEGORY_META, ENTITY_CATEGORY_LABELS, EVENT_TYPE_META } from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

export const TimelinePage: React.FC = () => {
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Nível de Zoom Semântico: "macro" (Anos), "medium" (Meses), "micro" (Dias e Sequência)
  const [zoomLevel, setZoomLevel] = useState<TimelineZoomLevel>(
    (searchParams.get("zoom") as TimelineZoomLevel) || "micro"
  );
  const [focusedYear, setFocusedYear] = useState<number | null>(null);
  const [focusedMonth, setFocusedMonth] = useState<number | null>(null);

  // Filtros combináveis da linha do tempo
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [characterId, setCharacterId] = useState(searchParams.get("character_id") || "");
  const [npcId, setNpcId] = useState(searchParams.get("npc_id") || "");
  const [locationId, setLocationId] = useState(searchParams.get("location_id") || "");
  const [organizationId, setOrganizationId] = useState(
    searchParams.get("organization_id") || ""
  );
  const [sessionId, setSessionId] = useState(searchParams.get("session_id") || "");
  const [visibility, setVisibility] = useState(searchParams.get("visibility") || "");
  const [yearFrom, setYearFrom] = useState(searchParams.get("year_from") || "");
  const [yearTo, setYearTo] = useState(searchParams.get("year_to") || "");
  const [order, setOrder] = useState<"asc" | "desc">(
    (searchParams.get("order") as "asc" | "desc") || "asc"
  );
  const [showFilters, setShowFilters] = useState(false);

  // Estado dos modais
  const [modalOpen, setModalOpen] = useState(searchParams.get("newEvent") === "1");
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);
  const [creationContext, setCreationContext] = useState<{
    year?: number;
    month?: number | null;
    day?: number | null;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get("newEvent") === "1") {
      setEditingEvent(null);
      setCreationContext(null);
      setModalOpen(true);
      searchParams.delete("newEvent");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Busca de entidades, sessões e participantes para filtros e modal
  const { data: entitiesData } = useQuery({
    queryKey: ["entities", campaign.id, "all"],
    queryFn: () =>
      apiRequest<PaginatedEntities>(`/campaigns/${campaign.id}/entities?page_size=200`),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ["sessions", campaign.id, "all"],
    queryFn: () =>
      apiRequest<PaginatedSessions>(`/campaigns/${campaign.id}/sessions?page_size=200`),
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", campaign.id],
    queryFn: () => apiRequest<CampaignMember[]>(`/campaigns/${campaign.id}/members`),
  });

  const entities: Entity[] = entitiesData?.items || [];
  const sessions: GameSession[] = sessionsData?.items || [];
  const members: CampaignMember[] = membersData || [];

  const queryParams = new URLSearchParams();
  queryParams.set("order", order);
  queryParams.set("page_size", "300");
  if (search.trim()) queryParams.set("search", search.trim());
  if (category) queryParams.set("category", category);
  if (characterId) queryParams.set("character_id", characterId);
  if (npcId) queryParams.set("npc_id", npcId);
  if (locationId) queryParams.set("location_id", locationId);
  if (organizationId) queryParams.set("organization_id", organizationId);
  if (sessionId) queryParams.set("session_id", sessionId);
  if (visibility) queryParams.set("visibility", visibility);
  if (yearFrom.trim() !== "") queryParams.set("year_from", yearFrom.trim());
  if (yearTo.trim() !== "") queryParams.set("year_to", yearTo.trim());

  const {
    data: eventsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "events",
      campaign.id,
      search,
      category,
      characterId,
      npcId,
      locationId,
      organizationId,
      sessionId,
      visibility,
      yearFrom,
      yearTo,
      order,
    ],
    queryFn: () =>
      apiRequest<PaginatedEvents>(
        `/campaigns/${campaign.id}/events?${queryParams.toString()}`
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/events/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setEventToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["events", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      showToast("Acontecimento removido da linha do tempo.", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao excluir acontecimento.", "error");
    },
  });

  const hasActiveFilters = Boolean(
    search ||
      category ||
      characterId ||
      npcId ||
      locationId ||
      organizationId ||
      sessionId ||
      visibility ||
      yearFrom ||
      yearTo
  );

  const clearAllFilters = () => {
    setSearch("");
    setCategory("");
    setCharacterId("");
    setNpcId("");
    setLocationId("");
    setOrganizationId("");
    setSessionId("");
    setVisibility("");
    setYearFrom("");
    setYearTo("");
    setFocusedYear(null);
    setFocusedMonth(null);
  };

  const datedEvents = eventsData?.items || [];
  const undatedEvents = eventsData?.undated_items || [];

  // Constrói ou utiliza a hierarquia semântica de grupos temporais
  const timelineTree: TimelineYearGroup[] = useMemo(() => {
    if (eventsData?.timeline_tree && eventsData.timeline_tree.length > 0) {
      return eventsData.timeline_tree;
    }

    // Fallback de agrupamento no cliente
    const eraName = campaign.calendar_config?.era_name || "d.C.";
    const yearsMap = new Map<number, TimelineEvent[]>();

    for (const evt of datedEvents) {
      const yr = evt.year ?? evt.narrative_year;
      if (yr === null || yr === undefined) continue;
      if (!yearsMap.has(yr)) yearsMap.set(yr, []);
      yearsMap.get(yr)!.push(evt);
    }

    const sortedYears = Array.from(yearsMap.keys()).sort((a, b) =>
      order === "desc" ? b - a : a - b
    );

    return sortedYears.map((yr) => {
      const yrEvents = yearsMap.get(yr)!;
      const canonicalCount = yrEvents.filter((e) => e.event_type === "canonical").length;
      const playerCount = yrEvents.length - canonicalCount;
      const yearLevelEvents = yrEvents.filter((e) => (e.month ?? e.narrative_month) === null);

      const monthsMap = new Map<number, TimelineEvent[]>();
      for (const e of yrEvents) {
        const mo = e.month ?? e.narrative_month;
        if (mo !== null && mo !== undefined) {
          if (!monthsMap.has(mo)) monthsMap.set(mo, []);
          monthsMap.get(mo)!.push(e);
        }
      }

      const sortedMonths = Array.from(monthsMap.keys()).sort((a, b) =>
        order === "desc" ? b - a : a - b
      );

      const months: TimelineMonthGroup[] = sortedMonths.map((mo) => {
        const moEvents = monthsMap.get(mo)!;
        const monthCfg = campaign.calendar_config?.months?.[mo - 1];
        const monthName = monthCfg?.name || `Mês ${mo}`;
        const monthLevelEvents = moEvents.filter(
          (e) => (e.day ?? e.narrative_day) === null
        );

        const daysMap = new Map<number, TimelineEvent[]>();
        for (const e of moEvents) {
          const dy = e.day ?? e.narrative_day;
          if (dy !== null && dy !== undefined) {
            if (!daysMap.has(dy)) daysMap.set(dy, []);
            daysMap.get(dy)!.push(e);
          }
        }

        const sortedDays = Array.from(daysMap.keys()).sort((a, b) =>
          order === "desc" ? b - a : a - b
        );

        const days: TimelineDayGroup[] = sortedDays.map((dy) => {
          const dyEvents = daysMap.get(dy)!;
          return {
            day: dy,
            day_label: `${dy.toString().padStart(2, "0")} de ${monthName}`,
            total_events: dyEvents.length,
            events: dyEvents,
          };
        });

        return {
          month: mo,
          month_name: monthName,
          total_events: moEvents.length,
          month_level_events: monthLevelEvents,
          days,
        };
      });

      const yearLabel = yr < 0 ? `Ano ${Math.abs(yr)} a.C.` : `Ano ${yr} ${eraName}`.trim();

      return {
        year: yr,
        year_label: yearLabel,
        total_events: yrEvents.length,
        canonical_count: canonicalCount,
        player_count: playerCount,
        year_level_events: yearLevelEvents,
        months,
      };
    });
  }, [eventsData, datedEvents, campaign, order]);

  // Filtragem de foco por ano e mês se selecionado
  const displayedYears = useMemo(() => {
    if (focusedYear === null) return timelineTree;
    return timelineTree.filter((y) => y.year === focusedYear);
  }, [timelineTree, focusedYear]);

  // Função auxiliar para criação contextual em nós temporais
  const handleQuickAdd = (
    year?: number,
    month?: number | null,
    day?: number | null
  ) => {
    setEditingEvent(null);
    setCreationContext({ year, month, day });
    setModalOpen(true);
  };

  // Renderizador do Card do Acontecimento com diferenciação de autoria e sigilo
  const renderEventCard = (evt: TimelineEvent) => {
    const catMeta = EVENT_CATEGORY_META[evt.category] || EVENT_CATEGORY_META.outro;
    const typeMeta =
      EVENT_TYPE_META[evt.event_type || "canonical"] || EVENT_TYPE_META.canonical;
    const isCanonical = (evt.event_type || "canonical") === "canonical";
    const canManage = isGM || (user && evt.created_by_id === user.id);

    return (
      <article
        key={evt.id}
        className={`relative rounded-2xl bg-white text-[#16151A] border transition-all p-5 sm:p-6 shadow-sm hover:border-zinc-300 ${
          isCanonical
            ? "border-amber-300 ring-1 ring-amber-200/60 shadow-[0_2px_12px_rgba(245,158,11,0.08)]"
            : `${typeMeta.borderClass}`
        }`}
      >
        {/* Cabeçalho do Card: Autoria, Categoria e Sigilo */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Badge de Autoria & Tipo de Evento */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeMeta.badgeClass}`}
            >
              {isCanonical ? (
                <Crown className="w-3.5 h-3.5 text-amber-600" />
              ) : evt.event_type === "diary" ? (
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              ) : evt.event_type === "backstory" ? (
                <Scroll className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              )}
              {typeMeta.label}
            </span>

            {/* Identificação de quem criou */}
            {evt.created_by && (
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 bg-[#FAFAFB] px-2.5 py-1 rounded-lg border border-[#E6E6EA]">
                <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                {evt.created_by.name || evt.created_by.username}
              </span>
            )}

            {/* Categoria Narrativa */}
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${catMeta.badgeClass}`}
            >
              {catMeta.label}
            </span>

            {/* Indicador Claro de Visibilidade e Sigilo */}
            {evt.visibility === "private" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3 text-rose-500" />
                Secreto do Mestre
              </span>
            )}
            {evt.visibility === "restricted" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Eye className="w-3 h-3 text-amber-600" />
                Descoberta Restrita
              </span>
            )}
            {evt.visibility === "public" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-zinc-600 bg-zinc-100 border border-zinc-200">
                <Eye className="w-3 h-3 text-emerald-600" />
                Público
              </span>
            )}

            {/* Precisão Temporal: Horário / Momento e Desempate */}
            {(evt.time_label || evt.narrative_time) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#C42A3C] bg-[#FF4D5A]/10 border border-[#FF4D5A]/20">
                <Clock className="w-3.5 h-3.5 text-[#FF4D5A]" />
                {evt.time_label || evt.narrative_time}
              </span>
            )}

            {evt.sort_order !== undefined && evt.sort_order !== 0 && (
              <span className="text-[11px] font-mono text-zinc-400 bg-[#FAFAFB] px-2 py-0.5 rounded border border-[#E6E6EA]">
                ord: {evt.sort_order}
              </span>
            )}
          </div>

          {/* Ações: Detalhes, Editar, Excluir */}
          <div className="flex items-center gap-1.5">
            <Link
              to={`/campaigns/${campaign.id}/events/${evt.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-zinc-600 hover:text-[#16151A] bg-[#FAFAFB] hover:bg-zinc-100 border border-[#E6E6EA] transition-colors"
            >
              Detalhes
              <ExternalLink className="w-3 h-3" />
            </Link>

            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(evt);
                    setCreationContext(null);
                    setModalOpen(true);
                  }}
                  title="Editar acontecimento"
                  aria-label={`Editar acontecimento ${evt.title}`}
                  className="p-1.5 rounded-xl bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-500 hover:text-[#16151A] border border-[#E6E6EA] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEventToDelete(evt)}
                  title="Excluir acontecimento"
                  aria-label={`Excluir acontecimento ${evt.title}`}
                  className="p-1.5 rounded-xl bg-[#FAFAFB] hover:bg-rose-50 text-zinc-500 hover:text-rose-600 border border-[#E6E6EA] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Título do Acontecimento */}
        <h3 className="text-xl font-bold tracking-tight text-[#16151A]">
          <Link
            to={`/campaigns/${campaign.id}/events/${evt.id}`}
            className="hover:text-[#FF4D5A] transition-colors"
          >
            {evt.title}
          </Link>
        </h3>

        {/* Descrição */}
        <p className="text-sm text-zinc-600 mt-2 leading-relaxed whitespace-pre-line line-clamp-4">
          {evt.description}
        </p>

        {/* Vínculo de Sessão e Entidades */}
        {(evt.session || evt.entities.length > 0) && (
          <div className="mt-4 pt-3.5 border-t border-[#E6E6EA] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {evt.entities.map((ent) => (
                <Link
                  key={ent.id}
                  to={`/campaigns/${campaign.id}/entities/${ent.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-700 hover:text-[#16151A] border border-[#E6E6EA] transition-colors"
                >
                  <span className="font-semibold text-[10px] uppercase text-[#FF4D5A]">
                    {ENTITY_CATEGORY_LABELS[ent.category].split(" ")[0]}:
                  </span>
                  <span className="font-medium">{ent.name}</span>
                </Link>
              ))}
            </div>

            {evt.session && (
              <Link
                to={`/campaigns/${campaign.id}/sessions/${evt.session.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-700 border border-[#E6E6EA] transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#FF4D5A]" />
                Sessão #{String(evt.session.session_number).padStart(2, "0")}
              </Link>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Linha do Tempo e Controle de Zoom Semântico */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E6E6EA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20">
              EIXO CRONOLÓGICO DINÂMICO
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#16151A] mt-2">
            Linha do Tempo da Campanha
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Eixo compartilhado com granularidade multinível. Mestre e jogadores colaboram
            inserindo fatos no mesmo período.
          </p>
        </div>

        {/* Controles: Zoom Semântico, Ordem, Filtros e Novo Evento */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Zoom Semântico (Macro, Médio, Micro) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA]">
            <button
              type="button"
              onClick={() => {
                setZoomLevel("macro");
                setFocusedMonth(null);
              }}
              title="Visão Macro: Blocos Anuais e Décadas"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                zoomLevel === "macro"
                  ? "bg-[#FF4D5A] text-white shadow-[0_2px_8px_rgba(255,77,90,0.3)]"
                  : "text-zinc-600 hover:text-[#16151A]"
              }`}
            >
              <ZoomOut className="w-3.5 h-3.5" />
              Macro (Anos)
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("medium")}
              title="Visão Média: Subdivisão em Meses"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                zoomLevel === "medium"
                  ? "bg-[#FF4D5A] text-white shadow-[0_2px_8px_rgba(255,77,90,0.3)]"
                  : "text-zinc-600 hover:text-[#16151A]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Média (Meses)
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("micro")}
              title="Visão Micro: Sequência de Dias e Horários"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                zoomLevel === "micro"
                  ? "bg-[#FF4D5A] text-white shadow-[0_2px_8px_rgba(255,77,90,0.3)]"
                  : "text-zinc-600 hover:text-[#16151A]"
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Micro (Dias)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            {order === "asc" ? "Crescente" : "Decrescente"}
          </button>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-colors shadow-sm ${
              showFilters || hasActiveFilters
                ? "bg-[#FF4D5A]/10 text-[#C42A3C] border-[#FF4D5A]/30"
                : "bg-white hover:bg-[#FAFAFB] text-zinc-700 border-[#E6E6EA]"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
          </button>

          {/* Botão Novo Acontecimento (Estilo Destaque Coral) */}
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setCreationContext(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white font-semibold text-xs shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all"
          >
            <Plus className="w-4 h-4" />
            {isGM ? "Novo acontecimento" : "Adicionar registro"}
          </button>
        </div>
      </div>

      {/* Breadcrumb de foco por período */}
      {focusedYear !== null && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E6E6EA] shadow-sm text-xs">
          <span className="text-zinc-500">Visualizando foco:</span>
          <span className="font-semibold text-[#16151A]">
            Ano {focusedYear}
            {focusedMonth ? ` > Mês ${focusedMonth}` : ""}
          </span>
          <button
            type="button"
            onClick={() => {
              setFocusedYear(null);
              setFocusedMonth(null);
            }}
            className="ml-auto px-2.5 py-1 rounded-lg bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-600 border border-[#E6E6EA] text-xs transition-colors"
          >
            ✕ Limpar Foco (Ver todos os anos)
          </button>
        </div>
      )}

      {/* Painel de Filtros Combináveis */}
      {showFilters && (
        <section
          aria-label="Filtros da linha do tempo"
          className="rounded-2xl bg-white border border-[#E6E6EA] p-5 space-y-4 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar acontecimentos, diários ou hipóteses..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs focus:outline-none focus:border-[#FF4D5A]"
              />
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs focus:outline-none focus:border-[#FF4D5A]"
              >
                <option value="">Todas as Categorias</option>
                {(Object.keys(EVENT_CATEGORY_META) as EventCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {EVENT_CATEGORY_META[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs focus:outline-none focus:border-[#FF4D5A]"
              >
                <option value="">Todas as Sessões</option>
                <option value="none">Sem sessão associada</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sessão #{String(s.session_number).padStart(2, "0")} — {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6E6EA]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Ano:</span>
              <input
                type="number"
                placeholder="Ano de"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs"
              />
              <span className="text-zinc-400 text-xs">até</span>
              <input
                type="number"
                placeholder="Ano até"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs"
              />

              {isGM && (
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs"
                >
                  <option value="">Visibilidade (Todas)</option>
                  <option value="public">Apenas Públicos</option>
                  <option value="restricted">Apenas Restritos</option>
                  <option value="private">Apenas Privados (Mestre)</option>
                </select>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar Filtros
              </button>
            )}
          </div>
        </section>
      )}

      {/* Estados de Carregamento e Erro */}
      {isLoading && <LoadingState message="Consolidando eixo cronológico multinível..." />}

      {isError && (
        <ErrorState
          message={(error as Error)?.message || "Erro ao carregar linha do tempo."}
          onRetry={() => refetch()}
        />
      )}

      {/* Estado Vazio */}
      {!isLoading && !isError && datedEvents.length === 0 && undatedEvents.length === 0 && (
        <EmptyState
          title={
            hasActiveFilters
              ? "Nenhum acontecimento corresponde aos filtros aplicados"
              : "A linha do tempo ainda está vazia"
          }
          description="Comece registrando acontecimentos históricos, hipóteses de investigação ou notas de diário no eixo cronológico compartilhado."
          actionLabel={hasActiveFilters ? "Limpar Filtros" : "Registrar Primeiro Acontecimento"}
          onAction={hasActiveFilters ? clearAllFilters : () => handleQuickAdd()}
          icon={<Clock className="w-6 h-6" />}
        />
      )}

      {/* ========================================================================= */}
      {/* NÍVEL 1: VISÃO MACRO (ANOS / DÉCADAS)                                    */}
      {/* ========================================================================= */}
      {!isLoading && !isError && zoomLevel === "macro" && displayedYears.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedYears.map((yrGroup) => (
              <div
                key={yrGroup.year}
                className="rounded-2xl bg-white border border-[#E6E6EA] p-6 flex flex-col justify-between gap-5 transition-all hover:border-zinc-300 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[#E6E6EA]">
                    <span className="text-2xl font-bold tracking-tight text-[#16151A]">
                      {yrGroup.year_label}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20">
                      {yrGroup.total_events} {yrGroup.total_events === 1 ? "evento" : "eventos"}
                    </span>
                  </div>

                  {/* Resumo Quantitativo de Autoria */}
                  <div className="grid grid-cols-2 gap-2.5 my-3.5 text-xs">
                    <div className="p-3 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA]">
                      <span className="text-zinc-500 block text-xs">Fatos Canônicos</span>
                      <span className="text-[#FF4D5A] font-bold text-lg">
                        {yrGroup.canonical_count}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA]">
                      <span className="text-zinc-500 block text-xs">Registros Jogadores</span>
                      <span className="text-sky-600 font-bold text-lg">
                        {yrGroup.player_count}
                      </span>
                    </div>
                  </div>

                  {/* Meses com Registros */}
                  {yrGroup.months.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <span className="text-xs font-medium text-zinc-500">
                        Meses com atividade:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {yrGroup.months.map((m) => (
                          <button
                            key={m.month}
                            type="button"
                            onClick={() => {
                              setFocusedYear(yrGroup.year);
                              setFocusedMonth(m.month);
                              setZoomLevel("medium");
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-700 border border-[#E6E6EA] transition-colors"
                          >
                            {m.month_name} ({m.total_events})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eventos Gerais do Ano */}
                  {yrGroup.year_level_events.length > 0 && (
                    <div className="mt-3.5 p-3 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA]">
                      <span className="text-xs font-semibold text-[#16151A] block mb-1.5">
                        Contexto Geral do Ano:
                      </span>
                      <ul className="text-xs text-zinc-600 space-y-1">
                        {yrGroup.year_level_events.map((e) => (
                          <li key={e.id} className="truncate">
                            • {e.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Ações Rápidas no Bloco Anual (Colaboração Direta e Zoom) */}
                <div className="pt-3.5 border-t border-[#E6E6EA] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(yrGroup.year, null, null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF4D5A]" />
                    + Adicionar no Ano
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFocusedYear(yrGroup.year);
                      setZoomLevel("micro");
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FF4D5A] hover:bg-[#ff3b49] text-white shadow-[0_2px_8px_rgba(255,77,90,0.3)] transition-colors"
                  >
                    Ver Detalhes
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NÍVEL 2: VISÃO MÉDIA (MESES)                                              */}
      {/* ========================================================================= */}
      {!isLoading && !isError && zoomLevel === "medium" && displayedYears.length > 0 && (
        <div className="space-y-8">
          {displayedYears.map((yrGroup) => (
            <section
              key={yrGroup.year}
              className="rounded-2xl bg-white border border-[#E6E6EA] p-6 space-y-6 shadow-sm"
            >
              {/* Cabeçalho do Ano com Gatilho Contextual */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E6E6EA]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 font-bold flex items-center justify-center text-sm">
                    #
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#16151A]">
                      {yrGroup.year_label}
                    </h2>
                    <span className="text-xs text-zinc-500">
                      {yrGroup.total_events} fatos registrados ({yrGroup.canonical_count} canônicos,{" "}
                      {yrGroup.player_count} jogadores)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(yrGroup.year, null, null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF4D5A]" />
                    + Fato Geral do Ano {yrGroup.year}
                  </button>
                </div>
              </div>

              {/* Eventos de Nível Geral do Ano */}
              {yrGroup.year_level_events.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-[#16151A] uppercase block">
                    Contexto Geral do Ano (Sem Mês Definido)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {yrGroup.year_level_events.map((e) => renderEventCard(e))}
                  </div>
                </div>
              )}

              {/* Subdivisão nos Meses Registrados */}
              <div className="space-y-5">
                {yrGroup.months.map((mGroup) => (
                  <div
                    key={mGroup.month}
                    className="p-5 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#E6E6EA]">
                      <div>
                        <h3 className="text-lg font-bold text-[#16151A]">
                          {mGroup.month_name} de {yrGroup.year}
                        </h3>
                        <span className="text-xs text-zinc-500">
                          {mGroup.total_events} {mGroup.total_events === 1 ? "acontecimento" : "acontecimentos"} distribuídos em {mGroup.days.length} {mGroup.days.length === 1 ? "dia" : "dias"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Gatilho Contextual no Mês */}
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(yrGroup.year, mGroup.month, null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Plus className="w-3 h-3 text-[#FF4D5A]" />
                          + Adicionar no Mês
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFocusedYear(yrGroup.year);
                            setFocusedMonth(mGroup.month);
                            setZoomLevel("micro");
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white text-xs font-semibold shadow-[0_2px_8px_rgba(255,77,90,0.3)] transition-colors"
                        >
                          Ver Dias
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Eventos Gerais do Mês */}
                    {mGroup.month_level_events.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-zinc-500">
                          Acontecimentos Gerais deste Mês:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {mGroup.month_level_events.map((e) => renderEventCard(e))}
                        </div>
                      </div>
                    )}

                    {/* Resumo dos Dias do Mês */}
                    {mGroup.days.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-xs font-medium text-zinc-500">
                          Dias com registros:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {mGroup.days.map((d) => (
                            <button
                              key={d.day}
                              type="button"
                              onClick={() => {
                                setFocusedYear(yrGroup.year);
                                setFocusedMonth(mGroup.month);
                                setZoomLevel("micro");
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs bg-white hover:bg-zinc-50 text-zinc-700 border border-[#E6E6EA] transition-colors"
                            >
                              Dia {d.day} ({d.total_events})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* NÍVEL 3: VISÃO MICRO (DIAS E SEQUÊNCIA DETALHADA)                         */}
      {/* ========================================================================= */}
      {!isLoading && !isError && zoomLevel === "micro" && displayedYears.length > 0 && (
        <div className="space-y-10">
          {displayedYears.map((yrGroup) => (
            <div key={yrGroup.year} className="space-y-6">
              {/* Nó de Ano no Eixo */}
              <div
                id={`year-marker-${yrGroup.year}`}
                className="flex flex-wrap items-center justify-between gap-3 pt-6 pb-3 border-b border-[#E6E6EA]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 font-bold flex items-center justify-center text-sm">
                    #
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#16151A]">
                      {yrGroup.year_label}
                    </h2>
                    <span className="text-xs text-zinc-500">
                      {yrGroup.total_events} acontecimentos consolidados neste ano
                    </span>
                  </div>
                </div>

                {/* Gatilho Contextual de Adição no Ano */}
                <button
                  type="button"
                  onClick={() => handleQuickAdd(yrGroup.year, null, null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FF4D5A]" />
                  + Adicionar no Ano {yrGroup.year}
                </button>
              </div>

              {/* Eventos Gerais do Ano (Contexto Primário) */}
              {yrGroup.year_level_events.length > 0 && (
                <div className="relative pl-6 sm:pl-10 before:content-[''] before:absolute before:left-2.5 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6E6EA] space-y-4">
                  <div className="relative -ml-6 sm:-ml-10 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 text-xs font-semibold">
                      Contexto Geral do Ano
                    </span>
                  </div>
                  <div className="space-y-4">
                    {yrGroup.year_level_events.map((e) => renderEventCard(e))}
                  </div>
                </div>
              )}

              {/* Meses e Dias */}
              {yrGroup.months.map((mGroup) => (
                <div key={mGroup.month} className="space-y-6 pt-2">
                  {/* Cabeçalho do Mês com Gatilho de Adição Rápida */}
                  <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA]">
                    <span className="text-base font-bold text-[#16151A]">
                      {mGroup.month_name} de {yrGroup.year}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(yrGroup.year, mGroup.month, null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Plus className="w-3 h-3 text-[#FF4D5A]" />
                      + Adicionar em {mGroup.month_name}
                    </button>
                  </div>

                  {/* Eventos Gerais do Mês */}
                  {mGroup.month_level_events.length > 0 && (
                    <div className="relative pl-6 sm:pl-10 before:content-[''] before:absolute before:left-2.5 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6E6EA] space-y-4">
                      <div className="relative -ml-6 sm:-ml-10 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-semibold">
                          Contexto do Mês ({mGroup.month_name})
                        </span>
                      </div>
                      <div className="space-y-4">
                        {mGroup.month_level_events.map((e) => renderEventCard(e))}
                      </div>
                    </div>
                  )}

                  {/* Dias com Sequência e Empilhamento de Cards Compartilhados */}
                  {mGroup.days.map((dGroup) => (
                    <div
                      key={dGroup.day}
                      className="relative pl-6 sm:pl-10 before:content-[''] before:absolute before:left-2.5 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6E6EA] space-y-4"
                    >
                      {/* Cabeçalho do Nó Temporal do Dia com Gatilho Contextual */}
                      <div className="relative -ml-6 sm:-ml-10 flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white bg-[#FF4D5A] shadow-sm ring-4 ring-[#FF4D5A]/20" />
                          <span className="text-base font-bold text-[#16151A]">
                            {dGroup.day_label} de {yrGroup.year}
                          </span>
                          <span className="text-xs text-zinc-500">
                            ({dGroup.total_events} {dGroup.total_events === 1 ? "registro" : "registros"})
                          </span>
                        </div>

                        {/* Gatilho Visual de Adição Rápida no Dia Selecionado */}
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(yrGroup.year, mGroup.month, dGroup.day)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#FF4D5A]" />
                          + Adicionar neste dia
                        </button>
                      </div>

                      {/* Cards empilhados no mesmo dia (Mestre e Jogadores) */}
                      <div className="space-y-4">
                        {dGroup.events.map((evt) => renderEventCard(evt))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO DE ACONTECIMENTOS SEM DATA DEFINIDA (UNDATED)                       */}
      {/* ========================================================================= */}
      {!isLoading && !isError && undatedEvents.length > 0 && (
        <section
          id="undated-events-section"
          className="pt-8 border-t border-[#E6E6EA] space-y-4"
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-[#FF4D5A]" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#16151A]">
                  Acontecimentos sem Data Definida ({undatedEvents.length})
                </h2>
                <p className="text-xs text-zinc-500">
                  Registros cuja data exata é desconhecida ou que antecedem os registros da cronologia.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setCreationContext(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF4D5A]" />
              Adicionar Indefinido
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {undatedEvents.map((evt) => renderEventCard(evt))}
          </div>
        </section>
      )}

      {/* Modal de Criação / Edição de Acontecimentos */}
      <EventFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
          setCreationContext(null);
        }}
        campaign={campaign}
        entities={entities}
        sessions={sessions}
        members={members}
        isGM={isGM}
        editingEvent={editingEvent}
        initialDate={creationContext}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={Boolean(eventToDelete)}
        title="Excluir Acontecimento"
        description={`Tem certeza que deseja remover "${eventToDelete?.title}" do eixo cronológico? Esta ação não pode ser desfeita.`}
        confirmLabel={deleteMutation.isPending ? "Excluindo..." : "Excluir Registro"}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (eventToDelete) deleteMutation.mutate(eventToDelete.id);
        }}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
