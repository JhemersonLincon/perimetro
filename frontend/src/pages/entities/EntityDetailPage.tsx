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
  RpgSystemBadge,
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
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/campaigns/${campaign.id}/entities`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#16151A] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#FF4D5A]" />
            Voltar para Entidades
          </Link>
          <RpgSystemBadge system={campaign.rpg_system} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/campaigns/${campaign.id}/timeline?${timelineFilterKey}=${entity.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white text-xs font-semibold shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            Filtrar na Linha do Tempo
          </Link>

          {isGM && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Cabeçalho e Descrição Completa da Entidade */}
      <article className="rounded-2xl bg-white border border-[#E6E6EA] p-6 sm:p-8 shadow-sm space-y-6 text-[#16151A]">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 pb-6 border-b border-[#E6E6EA]">
          {entity.image_url ? (
            <img
              src={entity.image_url}
              alt={`Retrato de ${entity.name}`}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-[#E6E6EA] shrink-0"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#FF4D5A]/10 border border-[#FF4D5A]/20 flex items-center justify-center text-[#FF4D5A] text-4xl font-bold shrink-0">
              {entity.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20">
                {ENTITY_CATEGORY_LABELS[entity.category]}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAFAFB] border border-[#E6E6EA] text-zinc-600">
                Status: {entity.status}
              </span>
              <VisibilityBadge visibility={entity.visibility} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#16151A]">
              {entity.name}
            </h1>

            <div className="text-xs text-zinc-500 flex flex-wrap gap-4">
              <span>Criado em: {formatDateTime(entity.created_at)}</span>
              <span>Atualizado em: {formatDateTime(entity.updated_at)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#16151A]">
            Descrição Completa
          </h2>
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] text-sm sm:text-base text-zinc-700 leading-relaxed whitespace-pre-line">
            {entity.description}
          </div>
        </div>

        {entity.extra_info && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#16151A]">
              Informações Complementares
            </h2>
            <div className="p-4 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] text-sm text-zinc-700 whitespace-pre-line">
              {entity.extra_info}
            </div>
          </div>
        )}
      </article>

      {/* Histórico de Acontecimentos e Sessões Relacionadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl bg-white border border-[#E6E6EA] p-6 space-y-4 shadow-sm text-[#16151A]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E6EA]">
            <h2 className="text-lg font-bold text-[#16151A] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF4D5A]" />
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
                    className="block p-4 rounded-2xl bg-[#FAFAFB] hover:bg-white border border-[#E6E6EA] hover:border-zinc-300 shadow-sm transition-all group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs text-[#FF4D5A]">
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
                      <h3 className="font-bold text-base text-[#16151A] group-hover:text-[#FF4D5A]">
                        {evt.title}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-[#FF4D5A] shrink-0" />
                    </div>
                    <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{evt.description}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white border border-[#E6E6EA] p-6 space-y-4 shadow-sm text-[#16151A]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E6EA]">
            <h2 className="text-lg font-bold text-[#16151A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#FF4D5A]" />
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
                    className="block p-4 rounded-2xl bg-[#FAFAFB] hover:bg-white border border-[#E6E6EA] hover:border-zinc-300 shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-[#FF4D5A] mb-1">
                      <span>SESSÃO #{String(sess.session_number).padStart(2, "0")}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${st.className}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-[#16151A]">
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
