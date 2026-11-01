import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import {
  CampaignMember,
  Entity,
  EntityCategory,
  PaginatedEntities,
} from "../../types";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  VisibilityBadge,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EntityFormModal } from "../../components/entities/EntityFormModal";
import { ENTITY_CATEGORY_LABELS } from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

export const EntitiesListPage: React.FC = () => {
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<EntityCategory>("character");
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);

  useEffect(() => {
    const newEntCat = searchParams.get("newEntity") as EntityCategory | null;
    if (newEntCat && isGM) {
      setInitialCategory(newEntCat);
      setEditingEntity(null);
      setModalOpen(true);
      searchParams.delete("newEntity");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, isGM, setSearchParams]);

  const query = new URLSearchParams();
  query.set("page_size", "100");
  if (search.trim()) query.set("search", search.trim());
  if (category) query.set("category", category);
  if (statusFilter) query.set("status", statusFilter);
  if (visibilityFilter) query.set("visibility", visibilityFilter);

  const {
    data: entitiesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["entities", campaign.id, search, category, statusFilter, visibilityFilter],
    queryFn: () =>
      apiRequest<PaginatedEntities>(`/campaigns/${campaign.id}/entities?${query.toString()}`),
  });

  const { data: membersData } = useQuery({
    queryKey: ["members", campaign.id],
    queryFn: () => apiRequest<CampaignMember[]>(`/campaigns/${campaign.id}/members`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/entities/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setEntityToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["entities", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      showToast("Entidade excluída com sucesso.", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao excluir entidade.", "error");
    },
  });

  const entities = entitiesData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#111111]">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF4D5A]">
            CATÁLOGO DE ELEMENTOS NARRATIVOS
          </span>
          <h1 className="font-display text-3xl font-bold uppercase text-[#111111] mt-1">
            Entidades da Campanha
          </h1>
          <p className="text-sm text-[#111111]/75 mt-1">
            Personagens, NPCs, Localidades e Organizações que participam ou influenciam os
            acontecimentos.
          </p>
        </div>

        {isGM && (
          <button
            type="button"
            onClick={() => {
              setEditingEntity(null);
              setInitialCategory((category as EntityCategory) || "character");
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#FF4D5A] hover:bg-amber-600 text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0_#111111] font-display font-bold uppercase text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Entidade
          </button>
        )}
      </div>

      {/* Abas de Categorias e Barra de Pesquisa */}
      <div className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { value: "", label: "Todas" },
              { value: "character", label: "Personagens (PJ)" },
              { value: "npc", label: "NPCs" },
              { value: "location", label: "Localidades" },
              { value: "organization", label: "Organizações" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                category === tab.value
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                  : "bg-obsidian-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou descrição..."
              aria-label="Pesquisar entidades"
              className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar por status"
              className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs"
            >
              <option value="">Todos os Status</option>
              <option value="ativo">Ativo / Ativa</option>
              <option value="ativa">Ativa</option>
              <option value="desaparecido">Desaparecido</option>
              <option value="morto">Morto</option>
              <option value="aposentado">Aposentado</option>
              <option value="desconhecido">Desconhecido</option>
              <option value="abandonada">Abandonada</option>
              <option value="destruida">Destruída</option>
              <option value="inativa">Inativa</option>
              <option value="extinta">Extinta</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {isGM && (
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                aria-label="Filtrar por visibilidade"
                className="flex-1 px-3 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-200 text-xs"
              >
                <option value="">Qualquer Visibilidade</option>
                <option value="public">Público</option>
                <option value="restricted">Restrito</option>
                <option value="private">Privado</option>
              </select>
            )}
            {(search || category || statusFilter || visibilityFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setStatusFilter("");
                  setVisibilityFilter("");
                }}
                className="p-2 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30"
                title="Limpar filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading && <LoadingState message="Carregando catálogo de entidades..." />}

      {isError && (
        <ErrorState
          message={(error as Error)?.message || "Erro ao carregar entidades."}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && entities.length === 0 && (
        <EmptyState
          title="Nenhuma entidade encontrada"
          description="Cadastre personagens, NPCs, localidades e organizações para vinculá-los aos acontecimentos da linha do tempo."
          actionLabel={isGM ? "Cadastrar Entidade" : undefined}
          onAction={
            isGM
              ? () => {
                  setEditingEntity(null);
                  setModalOpen(true);
                }
              : undefined
          }
          icon={<Users className="w-6 h-6" />}
        />
      )}

      {!isLoading && !isError && entities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {entities.map((ent) => (
            <article
              key={ent.id}
              className="rounded-2xl bg-obsidian-900 border border-zinc-800 hover:border-zinc-700 overflow-hidden flex flex-col justify-between transition-all shadow-lg"
            >
              <div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {ent.image_url ? (
                        <img
                          src={ent.image_url}
                          alt={`Imagem de ${ent.name}`}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-display font-bold text-lg shrink-0">
                          {ent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                          {ENTITY_CATEGORY_LABELS[ent.category]}
                        </span>
                        <h2 className="font-display text-lg font-bold text-zinc-100 leading-tight">
                          <Link
                            to={`/campaigns/${campaign.id}/entities/${ent.id}`}
                            className="hover:text-amber-400 transition-colors"
                          >
                            {ent.name}
                          </Link>
                        </h2>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-obsidian-950 border border-zinc-800 text-zinc-300">
                      {ent.status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {ent.description}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-obsidian-950/70 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <VisibilityBadge visibility={ent.visibility} />
                  <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {ent.events_count} evento(s)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    to={`/campaigns/${campaign.id}/entities/${ent.id}`}
                    className="px-2.5 py-1 rounded text-xs font-mono text-amber-400 hover:underline"
                  >
                    Ver Ficha
                  </Link>
                  {isGM && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEntity(ent);
                          setModalOpen(true);
                        }}
                        aria-label={`Editar ${ent.name}`}
                        className="p-1.5 text-zinc-400 hover:text-zinc-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntityToDelete(ent)}
                        aria-label={`Excluir ${ent.name}`}
                        className="p-1.5 text-zinc-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isGM && (
        <EntityFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingEntity(null);
          }}
          campaign={campaign}
          members={membersData || []}
          initialCategory={initialCategory}
          editingEntity={editingEntity}
        />
      )}

      <ConfirmDialog
        isOpen={!!entityToDelete}
        title="Excluir Entidade?"
        description={
          entityToDelete
            ? `Tem certeza que deseja excluir "${entityToDelete.name}"? Suas associações com acontecimentos serão removidas.`
            : ""
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (entityToDelete) {
            deleteMutation.mutate(entityToDelete.id);
          }
        }}
        onCancel={() => setEntityToDelete(null)}
      />
    </div>
  );
};
