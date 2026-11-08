import React, { useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Link2,
  Unlink,
  FileText,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import {
  CampaignMember,
  GameSessionDetail,
  PaginatedEvents,
} from "../../types";
import {
  LoadingState,
  ErrorState,
  VisibilityBadge,
  RpgSystemBadge,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SessionFormModal } from "../../components/sessions/SessionFormModal";
import {
  EVENT_CATEGORY_META,
  SESSION_STATUS_LABELS,
  formatDateTime,
  formatRealDate,
} from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

export const SessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [eventToLinkId, setEventToLinkId] = useState("");

  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => apiRequest<GameSessionDetail>(`/sessions/${sessionId}`),
    enabled: !!sessionId,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["events", campaign.id, "for-session-detail"],
    queryFn: () =>
      apiRequest<PaginatedEvents>(`/campaigns/${campaign.id}/events?page_size=200`),
    enabled: isGM,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", campaign.id],
    queryFn: () => apiRequest<CampaignMember[]>(`/campaigns/${campaign.id}/members`),
    enabled: isGM,
  });

  const linkMutation = useMutation({
    mutationFn: (evtId: string) =>
      apiRequest<GameSessionDetail>(`/sessions/${sessionId}/events/${evtId}`, {
        method: "POST",
      }),
    onSuccess: () => {
      setEventToLinkId("");
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["events", campaign.id] });
      showToast("Acontecimento associado à sessão!", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao associar acontecimento.", "error");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (evtId: string) =>
      apiRequest<GameSessionDetail>(`/sessions/${sessionId}/events/${evtId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["events", campaign.id] });
      showToast("Acontecimento removido da sessão.", "info");
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao desassociar acontecimento.", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest<void>(`/sessions/${sessionId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      showToast("Sessão excluída com sucesso.", "success");
      navigate(`/campaigns/${campaign.id}/sessions`);
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao excluir sessão.", "error");
    },
  });

  if (isLoading) {
    return <LoadingState message="Carregando detalhes da sessão..." />;
  }

  if (isError || !session) {
    return (
      <ErrorState
        message={(error as Error)?.message || "Sessão não encontrada."}
        onRetry={() => refetch()}
      />
    );
  }

  const st = SESSION_STATUS_LABELS[session.status] || SESSION_STATUS_LABELS.planejada;
  const allEvents = [
    ...(eventsData?.items || []),
    ...(eventsData?.undated_items || []),
  ];
  const linkedEventIds = new Set(session.events.map((e) => e.id));
  const availableEventsToLink = allEvents.filter((e) => !linkedEventIds.has(e.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/campaigns/${campaign.id}/sessions`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#16151A] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#FF4D5A]" />
            Voltar para Sessões
          </Link>
          <RpgSystemBadge system={campaign.rpg_system} />
        </div>

        {isGM && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
              Editar Sessão
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

      {/* Ficha Principal da Sessão */}
      <article className="rounded-2xl bg-white border border-[#E6E6EA] p-6 sm:p-8 shadow-sm space-y-6 text-[#16151A]">
        <div className="flex flex-wrap items-center gap-2.5 pb-4 border-b border-[#E6E6EA]">
          <span className="px-3 py-1 rounded-full bg-[#FF4D5A]/10 border border-[#FF4D5A]/20 text-xs font-semibold text-[#C42A3C]">
            SESSÃO #{String(session.session_number).padStart(2, "0")}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAFAFB] border border-[#E6E6EA] text-xs font-medium text-zinc-600">
            <Calendar className="w-3.5 h-3.5 text-[#FF4D5A]" />
            Data Real: {formatRealDate(session.real_date)}
          </span>

          <span className={`px-2.5 py-1 rounded-md text-xs font-mono border ${st.className}`}>
            {st.label}
          </span>

          <VisibilityBadge visibility={session.visibility} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#16151A]">
            {session.title}
          </h1>
          <div className="mt-2 text-xs text-zinc-500">
            Registrada em: {formatDateTime(session.created_at)}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#16151A]">
            Resumo Narrativo da Sessão
          </h2>
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] text-sm sm:text-base text-zinc-700 leading-relaxed whitespace-pre-line">
            {session.summary}
          </div>
        </div>

        {session.notes && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#16151A] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Observações e Notas
            </h2>
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] text-sm text-zinc-700 whitespace-pre-line">
              {session.notes}
            </div>
          </div>
        )}
      </article>

      {/* Acontecimentos Associados */}
      <section className="rounded-2xl bg-white border border-[#E6E6EA] p-6 space-y-5 shadow-sm text-[#16151A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E6EA]">
          <div>
            <h2 className="text-lg font-bold text-[#16151A] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF4D5A]" />
              Acontecimentos Associados ({session.events.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Eventos da linha do tempo que ocorreram ou foram descobertos durante esta sessão.
            </p>
          </div>

          {isGM && availableEventsToLink.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={eventToLinkId}
                onChange={(e) => setEventToLinkId(e.target.value)}
                aria-label="Selecionar acontecimento para associar"
                className="px-3 py-2 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs max-w-xs focus:outline-none focus:border-[#FF4D5A]"
              >
                <option value="">Associar acontecimento existente...</option>
                {availableEventsToLink.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.date_is_unknown ? "Sem data" : e.narrative_date})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!eventToLinkId || linkMutation.isPending}
                onClick={() => {
                  if (eventToLinkId) linkMutation.mutate(eventToLinkId);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                <Link2 className="w-3.5 h-3.5" />
                Associar
              </button>
            </div>
          )}
        </div>

        {session.events.length === 0 ? (
          <p className="text-sm text-zinc-500 py-8 text-center">
            Nenhum acontecimento associado a esta sessão no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {session.events.map((evt) => {
              const catMeta = EVENT_CATEGORY_META[evt.category] || EVENT_CATEGORY_META.outro;
              return (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-[#FAFAFB] hover:bg-white border border-[#E6E6EA] hover:border-zinc-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#FF4D5A]">
                        {evt.date_is_unknown
                          ? "Data Indefinida"
                          : `${evt.narrative_date || ""}${
                              evt.narrative_time ? ` • ${evt.narrative_time}` : ""
                            }`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${catMeta.badgeClass}`}
                      >
                        {catMeta.label}
                      </span>
                      <VisibilityBadge visibility={evt.visibility} />
                    </div>
                    <Link
                      to={`/campaigns/${campaign.id}/events/${evt.id}`}
                      className="font-semibold text-base text-[#16151A] hover:text-[#FF4D5A] block"
                    >
                      {evt.title}
                    </Link>
                    <p className="text-xs text-zinc-600 line-clamp-2">{evt.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/campaigns/${campaign.id}/events/${evt.id}`}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
                    >
                      Ver na Cronologia
                    </Link>
                    {isGM && (
                      <button
                        type="button"
                        onClick={() => unlinkMutation.mutate(evt.id)}
                        title="Remover associação com esta sessão"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        Desvincular
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isGM && (
        <SessionFormModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          campaign={campaign}
          members={membersData || []}
          events={allEvents}
          editingSession={session}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Excluir Sessão?"
        description={`Tem certeza que deseja excluir a Sessão #${session.session_number} ("${session.title}")?`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};
