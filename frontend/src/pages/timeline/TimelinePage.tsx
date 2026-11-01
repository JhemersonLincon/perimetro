import React, { useState, useEffect } from "react";
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
  Calendar,
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
  TimelineEvent,
} from "../../types";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  VisibilityBadge,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EventFormModal } from "../../components/timeline/EventFormModal";
import { EVENT_CATEGORY_META, ENTITY_CATEGORY_LABELS } from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

export const TimelinePage: React.FC = () => {
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
  const [showFilters, setShowFilters] = useState(true);

  // Estado dos modais
  const [modalOpen, setModalOpen] = useState(searchParams.get("newEvent") === "1");
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    if (searchParams.get("newEvent") === "1" && isGM) {
      setEditingEvent(null);
      setModalOpen(true);
      searchParams.delete("newEvent");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, isGM, setSearchParams]);

  // Busca de entidades, sessões e participantes para popular filtros e modal
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
  queryParams.set("page_size", "200");
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
  };

  const datedEvents = eventsData?.items || [];
  const undatedEvents = eventsData?.undated_items || [];

  // Lista de anos únicos para navegação rápida entre períodos
  const availableYears = Array.from(
    new Set(
      datedEvents
        .map((e) => e.narrative_year)
        .filter((y): y is number => y !== null && y !== undefined)
    )
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Linha do Tempo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#111111]">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF4D5A]">
            CRONOLOGIA INTERATIVA //{" "}
            {campaign.calendar_config?.type === "fictional"
              ? `CALENDÁRIO FICTÍCIO (${campaign.calendar_config.era_name || "ERA"})`
              : "CALENDÁRIO GREGORIANO"}
          </span>
          <h1 className="font-display text-3xl font-bold uppercase text-[#111111] mt-1">
            Linha do Tempo da Campanha
          </h1>
          <p className="text-sm text-[#111111]/75 mt-1">
            Explore a sequência cronológica de acontecimentos e suas conexões com personagens,
            NPCs, localidades, organizações e sessões.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded bg-obsidian-900 hover:bg-zinc-800 text-zinc-100 border-2 border-[#111111] shadow-[3px_3px_0_#FF4D5A] text-xs font-mono font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-amber-400" />
            Ordem: {order === "asc" ? "Crescente" : "Decrescente"}
          </button>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded border-2 border-[#111111] text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-[#FF4D5A] text-[#111111] shadow-[3px_3px_0_#111111]"
                : "bg-obsidian-900 text-zinc-100 shadow-[3px_3px_0_#FF4D5A]"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>

          {isGM && (
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#FF4D5A] hover:bg-amber-600 text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0_#111111] font-display font-bold uppercase text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Acontecimento
            </button>
          )}
        </div>
      </div>

      {/* Painel de Filtros Combináveis */}
      {showFilters && (
        <section
          aria-label="Filtros da linha do tempo"
          className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-5 space-y-4 shadow-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Pesquisa textual */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por título, descrição ou data narrativa..."
                aria-label="Pesquisar acontecimentos"
                className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Categoria */}
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filtrar por categoria"
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">Todas as Categorias</option>
                {(Object.keys(EVENT_CATEGORY_META) as EventCategory[]).map((k) => (
                  <option key={k} value={k}>
                    Categoria: {EVENT_CATEGORY_META[k].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sessão */}
            <div>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                aria-label="Filtrar por sessão"
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
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

            {/* Filtro por Personagem */}
            <div>
              <select
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                aria-label="Filtrar por personagem"
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">Todos os Personagens (PJ)</option>
                {entities
                  .filter((e) => e.category === "character")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      PJ: {e.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filtro por NPC */}
            <div>
              <select
                value={npcId}
                onChange={(e) => setNpcId(e.target.value)}
                aria-label="Filtrar por NPC"
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">Todos os NPCs</option>
                {entities
                  .filter((e) => e.category === "npc")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      NPC: {e.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filtro por Localidade */}
            <div>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                aria-label="Filtrar por localidade"
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">Todas as Localidades</option>
                {entities
                  .filter((e) => e.category === "location")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      Local: {e.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filtro por Organização */}
            <div>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                aria-label="Filtrar por organização"
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">Todas as Organizações</option>
                {entities
                  .filter((e) => e.category === "organization")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      Org: {e.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-zinc-400">Período (Ano):</span>
              <input
                type="number"
                placeholder="Ano inicial"
                aria-label="Ano inicial"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                className="w-28 px-2.5 py-1.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs font-mono"
              />
              <span className="text-zinc-500 text-xs">até</span>
              <input
                type="number"
                placeholder="Ano final"
                aria-label="Ano final"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                className="w-28 px-2.5 py-1.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs font-mono"
              />

              {isGM && (
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  aria-label="Filtrar por visibilidade"
                  className="px-3 py-1.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs"
                >
                  <option value="">Qualquer Visibilidade</option>
                  <option value="public">Somente Públicos</option>
                  <option value="restricted">Somente Restritos</option>
                  <option value="private">Somente Privados</option>
                </select>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-mono uppercase tracking-wider transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar Filtros
              </button>
            )}
          </div>
        </section>
      )}

      {/* Barra de Navegação Temporal por Períodos/Anos */}
      {availableYears.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-3.5 rounded-xl bg-obsidian-900 border-2 border-[#111111] shadow-[4px_4px_0_#FF4D5A]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Saltar para período:
          </span>
          {availableYears.map((yr) => (
            <a
              key={yr}
              href={`#year-marker-${yr}`}
              className="px-2.5 py-1 rounded-md text-xs font-mono bg-obsidian-950 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 shrink-0 transition-colors"
            >
              Ano {yr} {campaign.calendar_config?.era_name || ""}
            </a>
          ))}
          {undatedEvents.length > 0 && (
            <a
              href="#undated-events-section"
              className="px-2.5 py-1 rounded-md text-xs font-mono bg-obsidian-950 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-300 border border-zinc-800 shrink-0 transition-colors"
            >
              Sem Data Definida ({undatedEvents.length})
            </a>
          )}
        </div>
      )}

      {isLoading && <LoadingState message="Organizando cronologia da campanha..." />}

      {isError && (
        <ErrorState
          message={(error as Error)?.message || "Erro ao carregar linha do tempo."}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading &&
        !isError &&
        datedEvents.length === 0 &&
        undatedEvents.length === 0 && (
          <EmptyState
            title={
              hasActiveFilters
                ? "Nenhum acontecimento corresponde aos filtros aplicados"
                : "A linha do tempo ainda está vazia"
            }
            description={
              hasActiveFilters
                ? "Tente limpar os filtros ativos ou alterar os termos de pesquisa para visualizar todos os acontecimentos."
                : "Comece registrando acontecimentos históricos, descobertas ou cenas das sessões para construir a cronologia interativa."
            }
            actionLabel={
              hasActiveFilters
                ? "Limpar Filtros"
                : isGM
                ? "Registrar Primeiro Acontecimento"
                : undefined
            }
            onAction={
              hasActiveFilters
                ? clearAllFilters
                : isGM
                ? () => {
                    setEditingEvent(null);
                    setModalOpen(true);
                  }
                : undefined
            }
            icon={<Clock className="w-6 h-6" />}
          />
        )}

      {/* Eixo Cronológico Principal */}
      {!isLoading && !isError && datedEvents.length > 0 && (
        <div className="relative pl-6 sm:pl-10 before:content-[''] before:absolute before:left-2.5 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#FF4D5A] before:via-[#111111] before:to-[#111111] space-y-6">
          {datedEvents.map((evt, index) => {
            const catMeta = EVENT_CATEGORY_META[evt.category] || EVENT_CATEGORY_META.outro;
            const prevYear = index > 0 ? datedEvents[index - 1].narrative_year : null;
            const showYearHeader = evt.narrative_year !== prevYear && evt.narrative_year !== null;

            return (
              <React.Fragment key={evt.id}>
                {showYearHeader && (
                  <div
                    id={`year-marker-${evt.narrative_year}`}
                    className="relative -ml-6 sm:-ml-10 flex items-center gap-3 pt-4 pb-1"
                  >
                    <div className="w-6 sm:w-8 h-6 sm:h-8 rounded bg-[#16151A] text-[#FF4D5A] border-2 border-[#111111] shadow-[3px_3px_0_#FF4D5A] font-mono text-xs font-bold flex items-center justify-center">
                      #
                    </div>
                    <span className="font-display text-lg font-bold uppercase text-[#111111] tracking-wide">
                      Ano {evt.narrative_year} {campaign.calendar_config?.era_name || ""}
                    </span>
                    <div className="flex-1 h-0.5 bg-[#111111]/25" />
                  </div>
                )}

                <article
                  className={`relative rounded-2xl bg-obsidian-900 text-zinc-100 border-2 border-[#111111] p-5 sm:p-6 shadow-[6px_6px_0_#FF4D5A] transition-all ${
                    index >= 4 ? "timeline-node-deferred" : ""
                  }`}
                >
                  {/* Marcador no eixo vertical */}
                  <span
                    className={`absolute -left-[21px] sm:-left-[31px] top-6 w-3.5 h-3.5 rounded-full border-2 border-[#111111] ring-4 ring-[#EFEAE2] ${catMeta.dotClass}`}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-obsidian-950 border border-zinc-800 font-mono text-xs font-semibold text-amber-300">
                        {evt.narrative_date || "Data registrada"}
                        {evt.narrative_time ? ` • ${evt.narrative_time}` : ""}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-mono border ${catMeta.badgeClass}`}
                      >
                        {catMeta.label}
                      </span>

                      <VisibilityBadge visibility={evt.visibility} />

                      {evt.session && (
                        <Link
                          to={`/campaigns/${campaign.id}/sessions/${evt.session.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                        >
                          <BookOpen className="w-3 h-3 text-amber-400" />
                          Sessão #{String(evt.session.session_number).padStart(2, "0")}
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/campaigns/${campaign.id}/events/${evt.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-300 hover:text-amber-300 bg-obsidian-950 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                      >
                        Detalhes
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      {isGM && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEvent(evt);
                              setModalOpen(true);
                            }}
                            title="Editar acontecimento"
                            aria-label={`Editar acontecimento ${evt.title}`}
                            className="p-1.5 rounded-lg bg-obsidian-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEventToDelete(evt)}
                            title="Excluir acontecimento"
                            aria-label={`Excluir acontecimento ${evt.title}`}
                            className="p-1.5 rounded-lg bg-obsidian-950 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <h2 className="font-display text-xl font-bold text-zinc-100">
                    <Link
                      to={`/campaigns/${campaign.id}/events/${evt.id}`}
                      className="hover:text-amber-400 transition-colors"
                    >
                      {evt.title}
                    </Link>
                  </h2>

                  <p className="text-sm text-zinc-300 mt-2 leading-relaxed whitespace-pre-line line-clamp-4">
                    {evt.description}
                  </p>

                  {evt.entities.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        Conexões:
                      </span>
                      {evt.entities.map((ent) => (
                        <Link
                          key={ent.id}
                          to={`/campaigns/${campaign.id}/entities/${ent.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-obsidian-950 hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/30 transition-colors"
                        >
                          <span className="font-mono text-[10px] uppercase text-amber-400/90">
                            {ENTITY_CATEGORY_LABELS[ent.category].split(" ")[0]}:
                          </span>
                          <span className="font-medium">{ent.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Seção separada para Eventos sem Data Definida (Seção 8.7) */}
      {!isLoading && !isError && undatedEvents.length > 0 && (
        <section
          id="undated-events-section"
          className="pt-8 border-t-2 border-[#111111] space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-[#FF4D5A]" />
            <div>
              <h2 className="font-display text-xl font-bold uppercase text-[#111111]">
                Acontecimentos sem Data Definida
              </h2>
              <p className="text-xs text-[#111111]/75">
                Registros cuja data narrativa exata é desconhecida ou anterior aos registros
                datados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {undatedEvents.map((evt) => {
              const catMeta = EVENT_CATEGORY_META[evt.category] || EVENT_CATEGORY_META.outro;
              return (
                <article
                  key={evt.id}
                  className="rounded-2xl bg-obsidian-900 text-zinc-100 border-2 border-[#111111] shadow-[6px_6px_0_#FF4D5A] p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-xs">
                        Data Indefinida
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono border ${catMeta.badgeClass}`}
                        >
                          {catMeta.label}
                        </span>
                        <VisibilityBadge visibility={evt.visibility} />
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-bold text-zinc-100">
                      <Link
                        to={`/campaigns/${campaign.id}/events/${evt.id}`}
                        className="hover:text-amber-400"
                      >
                        {evt.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1.5 line-clamp-3">
                      {evt.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <div className="flex flex-wrap gap-1.5">
                      {evt.entities.map((ent) => (
                        <Link
                          key={ent.id}
                          to={`/campaigns/${campaign.id}/entities/${ent.id}`}
                          className="text-xs font-mono px-2 py-0.5 rounded bg-obsidian-950 border border-zinc-800 text-zinc-300 hover:text-amber-300"
                        >
                          {ent.name}
                        </Link>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/campaigns/${campaign.id}/events/${evt.id}`}
                        className="px-2.5 py-1 rounded text-xs font-mono text-amber-400 hover:underline"
                      >
                        Abrir
                      </Link>
                      {isGM && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEvent(evt);
                              setModalOpen(true);
                            }}
                            aria-label={`Editar ${evt.title}`}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEventToDelete(evt)}
                            aria-label={`Excluir ${evt.title}`}
                            className="p-1.5 text-zinc-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal de criação / edição */}
      <EventFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        campaign={campaign}
        entities={entities}
        sessions={sessions}
        members={members}
        editingEvent={editingEvent}
      />

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        title="Excluir Acontecimento?"
        description={
          eventToDelete
            ? `Deseja realmente excluir o acontecimento "${eventToDelete.title}" da linha do tempo? Esta operação não pode ser desfeita.`
            : ""
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (eventToDelete) {
            deleteMutation.mutate(eventToDelete.id);
          }
        }}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
