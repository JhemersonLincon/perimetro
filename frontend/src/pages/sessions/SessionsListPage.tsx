import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import {
  CampaignMember,
  GameSession,
  PaginatedEvents,
  PaginatedSessions,
} from "../../types";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  VisibilityBadge,
  RpgSystemBadge,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SessionFormModal } from "../../components/sessions/SessionFormModal";
import { SESSION_STATUS_LABELS, formatRealDate } from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

export const SessionsListPage: React.FC = () => {
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<GameSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<GameSession | null>(null);

  useEffect(() => {
    if (searchParams.get("newSession") === "1" && isGM) {
      setEditingSession(null);
      setModalOpen(true);
      searchParams.delete("newSession");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, isGM, setSearchParams]);

  const query = new URLSearchParams();
  query.set("order", order);
  query.set("page_size", "100");
  if (statusFilter) query.set("status", statusFilter);

  const {
    data: sessionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sessions", campaign.id, statusFilter, order],
    queryFn: () =>
      apiRequest<PaginatedSessions>(`/campaigns/${campaign.id}/sessions?${query.toString()}`),
  });

  const { data: eventsData } = useQuery({
    queryKey: ["events", campaign.id, "for-sessions"],
    queryFn: () =>
      apiRequest<PaginatedEvents>(`/campaigns/${campaign.id}/events?page_size=200`),
    enabled: isGM,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", campaign.id],
    queryFn: () => apiRequest<CampaignMember[]>(`/campaigns/${campaign.id}/members`),
    enabled: isGM,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setSessionToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["sessions", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["events", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      showToast("Sessão excluída com sucesso.", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao excluir sessão.", "error");
    },
  });

  const sessions = sessionsData?.items || [];
  const allEvents = [
    ...(eventsData?.items || []),
    ...(eventsData?.undated_items || []),
  ];
  const nextNumber =
    sessions.length > 0 ? Math.max(...sessions.map((s) => s.session_number)) + 1 : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6E6EA]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RpgSystemBadge system={campaign.rpg_system} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#16151A] mt-3">
            Sessões da Campanha
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Acompanhe as sessões planejadas e realizadas, e consulte os acontecimentos narrativos
            associados a cada encontro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            {order === "asc" ? "Sessão #01 → #N" : "Mais recentes"}
          </button>

          {isGM && (
            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white font-semibold text-xs shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Registrar Sessão
            </button>
          )}
        </div>
      </div>

      {/* Filtro de Status */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { value: "", label: "Todas" },
            { value: "planejada", label: "Planejadas" },
            { value: "realizada", label: "Realizadas" },
            { value: "cancelada", label: "Canceladas" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
              statusFilter === tab.value
                ? "bg-[#FF4D5A]/10 text-[#C42A3C] border-[#FF4D5A]/30 shadow-sm"
                : "bg-white hover:bg-[#FAFAFB] text-zinc-600 border-[#E6E6EA] shadow-sm"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingState message="Carregando sessões da campanha..." />}

      {isError && (
        <ErrorState
          message={(error as Error)?.message || "Erro ao carregar sessões."}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <EmptyState
          title="Nenhuma sessão registrada"
          description="Registre os encontros da sua mesa de RPG e associe os acontecimentos da cronologia."
          actionLabel={isGM ? "Registrar Primeira Sessão" : undefined}
          onAction={
            isGM
              ? () => {
                  setEditingSession(null);
                  setModalOpen(true);
                }
              : undefined
          }
          icon={<BookOpen className="w-6 h-6" />}
        />
      )}

      {!isLoading && !isError && sessions.length > 0 && (
        <div className="space-y-4">
          {sessions.map((sess) => {
            const st = SESSION_STATUS_LABELS[sess.status] || SESSION_STATUS_LABELS.planejada;
            return (
              <article
                key={sess.id}
                className="rounded-2xl bg-white border border-[#E6E6EA] hover:border-zinc-300 p-5 sm:p-6 transition-all shadow-sm text-[#16151A]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-[#FF4D5A]/10 border border-[#FF4D5A]/20 text-xs font-semibold text-[#C42A3C]">
                      SESSÃO #{String(sess.session_number).padStart(2, "0")}
                    </span>

                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {formatRealDate(sess.real_date)}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-mono border ${st.className}`}
                    >
                      {st.label}
                    </span>

                    <VisibilityBadge visibility={sess.visibility} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#FF4D5A]" />
                      {sess.events_count} acontecimento(s)
                    </span>

                    <Link
                      to={`/campaigns/${campaign.id}/sessions/${sess.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-700 border border-[#E6E6EA] text-xs font-semibold transition-colors"
                    >
                      Detalhes
                    </Link>

                    {isGM && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSession(sess);
                            setModalOpen(true);
                          }}
                          aria-label={`Editar sessão ${sess.title}`}
                          className="p-1.5 rounded-xl bg-[#FAFAFB] hover:bg-zinc-100 text-zinc-500 hover:text-[#16151A] border border-[#E6E6EA] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSessionToDelete(sess)}
                          aria-label={`Excluir sessão ${sess.title}`}
                          className="p-1.5 rounded-xl bg-[#FAFAFB] hover:bg-rose-50 text-zinc-500 hover:text-rose-600 border border-[#E6E6EA] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-bold tracking-tight text-[#16151A]">
                  <Link
                    to={`/campaigns/${campaign.id}/sessions/${sess.id}`}
                    className="hover:text-[#FF4D5A] transition-colors"
                  >
                    {sess.title}
                  </Link>
                </h2>

                <p className="text-sm text-zinc-600 mt-2 line-clamp-3 leading-relaxed">
                  {sess.summary}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {isGM && (
        <SessionFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingSession(null);
          }}
          campaign={campaign}
          members={membersData || []}
          events={allEvents}
          nextSessionNumber={nextNumber}
          editingSession={editingSession}
        />
      )}

      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Excluir Sessão?"
        description={
          sessionToDelete
            ? `Tem certeza que deseja excluir a Sessão #${sessionToDelete.session_number} ("${sessionToDelete.title}")? Os acontecimentos associados não serão apagados, apenas desvinculados desta sessão.`
            : ""
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (sessionToDelete) {
            deleteMutation.mutate(sessionToDelete.id);
          }
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
};
