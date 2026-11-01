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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#111111]">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF4D5A]">
            DIÁRIO DE ENCONTROS DE JOGO
          </span>
          <h1 className="font-display text-3xl font-bold uppercase text-[#111111] mt-1">
            Sessões da Campanha
          </h1>
          <p className="text-sm text-[#111111]/75 mt-1">
            Acompanhe as sessões planejadas e realizadas, e consulte os acontecimentos narrativos
            associados a cada encontro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded bg-obsidian-900 hover:bg-zinc-800 text-zinc-100 border-2 border-[#111111] shadow-[3px_3px_0_#FF4D5A] text-xs font-mono font-bold uppercase tracking-wider"
          >
            <ArrowUpDown className="w-4 h-4 text-amber-400" />
            {order === "asc" ? "Sessão #01 → #N" : "Mais recentes"}
          </button>

          {isGM && (
            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#FF4D5A] hover:bg-amber-600 text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0_#111111] font-display font-bold uppercase text-xs transition-colors"
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
            className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#111111] transition-colors ${
              statusFilter === tab.value
                ? "bg-[#FF4D5A] text-[#111111] shadow-[3px_3px_0_#111111]"
                : "bg-obsidian-900 text-zinc-100 hover:bg-zinc-800 shadow-[3px_3px_0_#FF4D5A]"
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
                className="rounded-2xl bg-obsidian-900 border border-zinc-800 hover:border-zinc-700 p-5 sm:p-6 transition-all shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 font-mono text-xs font-bold text-amber-300">
                      SESSÃO #{String(sess.session_number).padStart(2, "0")}
                    </span>

                    <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
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
                    <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {sess.events_count} acontecimento(s)
                    </span>

                    <Link
                      to={`/campaigns/${campaign.id}/sessions/${sess.id}`}
                      className="px-3 py-1 rounded-lg bg-obsidian-950 hover:bg-zinc-800 text-amber-400 border border-zinc-800 text-xs font-mono"
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
                          className="p-1.5 rounded-lg bg-obsidian-950 text-zinc-400 hover:text-zinc-100 border border-zinc-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSessionToDelete(sess)}
                          aria-label={`Excluir sessão ${sess.title}`}
                          className="p-1.5 rounded-lg bg-obsidian-950 text-zinc-400 hover:text-rose-400 border border-zinc-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h2 className="font-display text-xl font-bold text-zinc-100">
                  <Link
                    to={`/campaigns/${campaign.id}/sessions/${sess.id}`}
                    className="hover:text-amber-400 transition-colors"
                  >
                    {sess.title}
                  </Link>
                </h2>

                <p className="text-sm text-zinc-300 mt-2 line-clamp-3 leading-relaxed">
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
