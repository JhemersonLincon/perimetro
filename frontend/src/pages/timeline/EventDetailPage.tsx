import React, { useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Clock,
  BookOpen,
  Edit3,
  Trash2,
  Users,
  Calendar,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import {
  CampaignMember,
  PaginatedEntities,
  PaginatedEvents,
  PaginatedSessions,
  TimelineEvent,
} from "../../types";
import {
  LoadingState,
  ErrorState,
  VisibilityBadge,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EventFormModal } from "../../components/timeline/EventFormModal";
import {
  EVENT_CATEGORY_META,
  ENTITY_CATEGORY_LABELS,
  formatDateTime,
} from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiRequest<TimelineEvent>(`/events/${eventId}`),
    enabled: !!eventId,
  });

  const { data: allEventsData } = useQuery({
    queryKey: ["events", campaign.id, "neighbors"],
    queryFn: () =>
      apiRequest<PaginatedEvents>(`/campaigns/${campaign.id}/events?order=asc&page_size=200`),
  });

  const { data: entitiesData } = useQuery({
    queryKey: ["entities", campaign.id, "all"],
    queryFn: () =>
      apiRequest<PaginatedEntities>(`/campaigns/${campaign.id}/entities?page_size=200`),
    enabled: isGM,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ["sessions", campaign.id, "all"],
    queryFn: () =>
      apiRequest<PaginatedSessions>(`/campaigns/${campaign.id}/sessions?page_size=200`),
    enabled: isGM,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", campaign.id],
    queryFn: () => apiRequest<CampaignMember[]>(`/campaigns/${campaign.id}/members`),
    enabled: isGM,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest<void>(`/events/${eventId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      showToast("Acontecimento excluído com sucesso.", "success");
      navigate(`/campaigns/${campaign.id}/timeline`);
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao excluir acontecimento.", "error");
    },
  });

  if (isLoading) {
    return <LoadingState message="Carregando detalhes do acontecimento..." />;
  }

  if (isError || !event) {
    return (
      <ErrorState
        message={(error as Error)?.message || "Acontecimento não encontrado."}
        onRetry={() => refetch()}
      />
    );
  }

  const catMeta = EVENT_CATEGORY_META[event.category] || EVENT_CATEGORY_META.outro;

  // Identifica acontecimentos cronologicamente próximos (anterior e próximo)
  const datedList = allEventsData?.items || [];
  const currentIdx = datedList.findIndex((e) => e.id === event.id);
  const prevEvent = currentIdx > 0 ? datedList[currentIdx - 1] : null;
  const nextEvent =
    currentIdx >= 0 && currentIdx < datedList.length - 1 ? datedList[currentIdx + 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/campaigns/${campaign.id}/timeline`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#16151A] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF4D5A]" />
          Voltar para a Linha do Tempo
        </Link>

        {isGM && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </div>
        )}
      </div>

      <article className="rounded-2xl bg-white border border-[#E6E6EA] p-6 sm:p-8 shadow-sm space-y-6 text-[#16151A]">
        <div className="flex flex-wrap items-center gap-2.5 pb-4 border-b border-[#E6E6EA]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4D5A]/10 border border-[#FF4D5A]/20 text-xs font-semibold text-[#C42A3C]">
            <Clock className="w-3.5 h-3.5 text-[#FF4D5A]" />
            {event.date_is_unknown
              ? "Data Indefinida"
              : `${event.narrative_date || ""}${
                  event.narrative_time ? ` • ${event.narrative_time}` : ""
                }`}
          </span>

          <span
            className={`px-2.5 py-1 rounded-md text-xs font-mono border ${catMeta.badgeClass}`}
          >
            {catMeta.label}
          </span>

          <VisibilityBadge visibility={event.visibility} />

          {event.session && (
            <Link
              to={`/campaigns/${campaign.id}/sessions/${event.session.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-700 border border-[#E6E6EA] transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#FF4D5A]" />
              Sessão #{String(event.session.session_number).padStart(2, "0")}:{" "}
              {event.session.title}
            </Link>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#16151A]">
            {event.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Registrado em: {formatDateTime(event.created_at)}
            </span>
            <span>Última atualização: {formatDateTime(event.updated_at)}</span>
          </div>
        </div>

        {/* Descrição completa formatada */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] text-zinc-700 text-sm sm:text-base leading-relaxed space-y-3 whitespace-pre-line">
          {event.description}
        </div>

        {/* Entidades Relacionadas */}
        <div className="pt-4 border-t border-[#E6E6EA] space-y-3">
          <h2 className="text-base font-bold text-[#16151A] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF4D5A]" />
            Entidades Relacionadas ({event.entities.length})
          </h2>

          {event.entities.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nenhuma entidade vinculada a este acontecimento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {event.entities.map((ent) => (
                <Link
                  key={ent.id}
                  to={`/campaigns/${campaign.id}/entities/${ent.id}`}
                  className="p-4 rounded-2xl bg-[#FAFAFB] hover:bg-white border border-[#E6E6EA] hover:border-zinc-300 shadow-sm flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#FF4D5A]">
                      {ENTITY_CATEGORY_LABELS[ent.category]}
                    </div>
                    <div className="font-display font-semibold text-sm text-[#16151A] group-hover:text-[#FF4D5A] mt-0.5">
                      {ent.name}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white text-zinc-600 border border-[#E6E6EA]">
                    {ent.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Acontecimentos Próximos na Cronologia */}
      {(prevEvent || nextEvent) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevEvent ? (
            <Link
              to={`/campaigns/${campaign.id}/events/${prevEvent.id}`}
              className="p-5 rounded-2xl bg-white hover:bg-[#FAFAFB] border border-[#E6E6EA] shadow-sm transition-all"
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                ← Acontecimento Anterior
              </div>
              <div className="font-semibold text-sm text-[#16151A] mt-1">
                {prevEvent.title}
              </div>
              <div className="text-xs font-mono text-[#FF4D5A] mt-0.5">
                {prevEvent.narrative_date}
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextEvent && (
            <Link
              to={`/campaigns/${campaign.id}/events/${nextEvent.id}`}
              className="p-5 rounded-2xl bg-white hover:bg-[#FAFAFB] border border-[#E6E6EA] text-right shadow-sm transition-all"
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Próximo Acontecimento →
              </div>
              <div className="font-semibold text-sm text-[#16151A] mt-1">
                {nextEvent.title}
              </div>
              <div className="text-xs font-mono text-[#FF4D5A] mt-0.5">
                {nextEvent.narrative_date}
              </div>
            </Link>
          )}
        </section>
      )}

      {isGM && (
        <EventFormModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          campaign={campaign}
          entities={entitiesData?.items || []}
          sessions={sessionsData?.items || []}
          members={membersData || []}
          editingEvent={event}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Excluir Acontecimento?"
        description={`Tem certeza que deseja excluir "${event.title}"?`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};
