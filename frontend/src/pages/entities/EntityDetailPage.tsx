import React, { useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Edit3,
  Trash2,
  Clock,
  BookOpen,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import { CampaignMember, EntityDetail } from "../../types";
import {
  LoadingState,
  ErrorState,
  VisibilityBadge,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EntityFormModal } from "../../components/entities/EntityFormModal";
import {
  ENTITY_CATEGORY_LABELS,
  EVENT_CATEGORY_META,
  SESSION_STATUS_LABELS,
  formatDateTime,
  formatRealDate,
} from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

export const EntityDetailPage: React.FC = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const {
    data: entity,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["entity", entityId],
    queryFn: () => apiRequest<EntityDetail>(`/entities/${entityId}`),
    enabled: !!entityId,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", campaign.id],
    queryFn: () => apiRequest<CampaignMember[]>(`/campaigns/${campaign.id}/members`),
    enabled: isGM,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest<void>(`/entities/${entityId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      showToast("Entidade excluída com sucesso.", "success");
      navigate(`/campaigns/${campaign.id}/entities`);
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao excluir entidade.", "error");
    },
  });

  if (isLoading) {
    return <LoadingState message="Carregando dossiê da entidade..." />;
  }

  if (isError || !entity) {
    return (
      <ErrorState
        message={(error as Error)?.message || "Entidade não encontrada."}
        onRetry={() => refetch()}
      />
    );
  }

  const filterParamMap: Record<string, string> = {
    character: "character_id",
    npc: "npc_id",
    location: "location_id",
    organization: "organization_id",
  };
  const timelineFilterKey = filterParamMap[entity.category] || "entity_id";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/campaigns/${campaign.id}/entities`}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#111111] hover:text-[#FF4D5A]"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF4D5A]" />
          Voltar para Entidades
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/campaigns/${campaign.id}/timeline?${timelineFilterKey}=${entity.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#FF4D5A] hover:bg-amber-600 text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0_#111111] text-xs font-mono font-bold uppercase tracking-wider"
          >
            <Filter className="w-3.5 h-3.5" />
            Filtrar na Linha do Tempo
          </Link>

          {isGM && (
            <>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-obsidian-900 hover:bg-zinc-800 text-zinc-100 border-2 border-[#111111] shadow-[3px_3px_0_#FF4D5A] text-xs font-mono font-bold uppercase"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-obsidian-900 hover:bg-rose-950/60 text-rose-300 border-2 border-[#111111] shadow-[3px_3px_0_#FF4D5A] text-xs font-mono font-bold uppercase"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cabeçalho e Descrição Completa da Entidade */}
      <article className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 pb-6 border-b border-zinc-800">
          {entity.image_url ? (
            <img
              src={entity.image_url}
              alt={`Retrato de ${entity.name}`}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-zinc-700 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-display text-4xl font-bold shrink-0">
              {entity.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {ENTITY_CATEGORY_LABELS[entity.category]}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase bg-obsidian-950 border border-zinc-800 text-zinc-200">
                Status: {entity.status}
              </span>
              <VisibilityBadge visibility={entity.visibility} />
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-100">
              {entity.name}
            </h1>

            <div className="text-xs font-mono text-zinc-500 flex flex-wrap gap-4">
              <span>Criado em: {formatDateTime(entity.created_at)}</span>
              <span>Atualizado em: {formatDateTime(entity.updated_at)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-amber-400">
            Descrição Completa
          </h2>
          <div className="p-5 rounded-xl bg-obsidian-950 border border-zinc-800/80 text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-line">
            {entity.description}
          </div>
        </div>

        {entity.extra_info && (
          <div className="space-y-2">
            <h2 className="font-mono text-xs uppercase tracking-widest text-amber-400">
              Informações Complementares
            </h2>
            <div className="p-4 rounded-xl bg-obsidian-950/70 border border-zinc-800 text-sm text-zinc-300 whitespace-pre-line">
              {entity.extra_info}
            </div>
          </div>
        )}
      </article>

      {/* Histórico de Acontecimentos e Sessões Relacionadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="font-display text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Acontecimentos Relacionados ({entity.related_events.length})
            </h2>
          </div>

          {entity.related_events.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">
              Esta entidade ainda não está associada a nenhum acontecimento visível na linha do
              tempo.
            </p>
          ) : (
            <div className="space-y-3">
              {entity.related_events.map((evt) => {
                const catMeta = EVENT_CATEGORY_META[evt.category] || EVENT_CATEGORY_META.outro;
                return (
                  <Link
                    key={evt.id}
                    to={`/campaigns/${campaign.id}/events/${evt.id}`}
                    className="block p-4 rounded-xl bg-obsidian-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 transition-all group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs text-amber-400">
                        {evt.date_is_unknown
                          ? "Data Indefinida"
                          : `${evt.narrative_date || ""}${
                              evt.narrative_time ? ` • ${evt.narrative_time}` : ""
                            }`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${catMeta.badgeClass}`}
                        >
                          {catMeta.label}
                        </span>
                        <VisibilityBadge visibility={evt.visibility} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-semibold text-base text-zinc-100 group-hover:text-amber-300">
                        {evt.title}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{evt.description}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="font-display text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Sessões Relacionadas ({entity.related_sessions.length})
            </h2>
          </div>

          {entity.related_sessions.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">
              Nenhuma sessão indiretamente vinculada a esta entidade até o momento.
            </p>
          ) : (
            <div className="space-y-3">
              {entity.related_sessions.map((sess) => {
                const st =
                  SESSION_STATUS_LABELS[sess.status] || SESSION_STATUS_LABELS.planejada;
                return (
                  <Link
                    key={sess.id}
                    to={`/campaigns/${campaign.id}/sessions/${sess.id}`}
                    className="block p-3.5 rounded-xl bg-obsidian-950 hover:bg-zinc-900 border border-zinc-800 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-1">
                      <span>SESSÃO #{String(sess.session_number).padStart(2, "0")}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${st.className}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="font-display font-semibold text-sm text-zinc-100">
                      {sess.title}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-1">
                      Data: {formatRealDate(sess.real_date)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {isGM && (
        <EntityFormModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          campaign={campaign}
          members={membersData || []}
          editingEntity={entity}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Excluir Entidade?"
        description={`Tem certeza que deseja excluir "${entity.name}"?`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};
