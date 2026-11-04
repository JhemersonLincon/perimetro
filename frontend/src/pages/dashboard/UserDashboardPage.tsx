import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Ticket,
  Settings,
  Archive,
  Trash2,
  ArrowUpRight,
  Users,
  BookOpen,
  Clock,
  FolderKanban,
  RotateCcw,
} from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { apiRequest } from "../../services/api";
import { Campaign } from "../../types";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  RoleBadge,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DialogModal } from "../../components/ui/DialogModal";
import { useToast } from "../../contexts/ToastContext";
import { formatDateTime } from "../../utils/formatters";

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");

  const {
    data: campaigns,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["campaigns", statusFilter],
    queryFn: () =>
      apiRequest<Campaign[]>(
        statusFilter === "all" ? "/campaigns" : `/campaigns?status=${statusFilter}`
      ),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: "active" | "archived" }) =>
      apiRequest<Campaign>(`/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      showToast(
        updated.status === "archived"
          ? "Campanha arquivada com sucesso."
          : "Campanha reativada com sucesso.",
        "success"
      );
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao alterar status da campanha.", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/campaigns/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setCampaignToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      showToast("Campanha excluída permanentemente.", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao excluir campanha.", "error");
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: (token: string) =>
      apiRequest<Campaign>(`/invitations/${encodeURIComponent(token.trim())}/accept`, {
        method: "POST",
      }),
    onSuccess: (camp) => {
      setInviteModalOpen(false);
      setInviteToken("");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      showToast(`Você ingressou na campanha "${camp.name}"!`, "success");
      navigate(`/campaigns/${camp.id}`);
    },
    onError: (err: any) => {
      showToast(err.message || "Não foi possível aceitar o convite.", "error");
    },
  });

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#16151A] flex flex-col antialiased">
      <Navbar />

      {/* Header Moderno do Painel de Campanhas */}
      <section className="bg-white border-b border-[#E6E6EA] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#16151A]">
              Minhas Campanhas
            </h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-xl">
              Gerencie seus arquivos narrativos ou acompanhe as linhas do tempo em que participa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E6E6EA] text-zinc-700 hover:bg-[#FAFAFB] hover:border-zinc-300 text-xs font-semibold shadow-sm transition-all"
            >
              <Ticket className="w-4 h-4 text-[#FF4D5A]" />
              Aceitar Convite
            </button>
            <Link
              to="/campaigns/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white text-xs font-semibold shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Campanha
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Filtros em Abas Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E6E6EA] rounded-2xl">
            {(
              [
                { key: "all", label: "Todas" },
                { key: "active", label: "Ativas" },
                { key: "archived", label: "Arquivadas" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-1.5 text-xs rounded-xl font-medium transition-all ${
                  statusFilter === tab.key
                    ? "bg-[#FF4D5A]/10 text-[#C42A3C] font-semibold"
                    : "text-zinc-500 hover:text-[#16151A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {campaigns && (
            <span className="text-xs text-zinc-400 font-medium">
              {campaigns.length} {campaigns.length === 1 ? "campanha encontrada" : "campanhas encontradas"}
            </span>
          )}
        </div>

        {isLoading && <LoadingState message="Carregando suas campanhas..." />}

        {isError && (
          <ErrorState
            message={(error as Error)?.message || "Erro ao buscar campanhas."}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && campaigns && campaigns.length === 0 && (
          <EmptyState
            title="Nenhuma campanha encontrada"
            description="Crie sua primeira campanha para organizar acontecimentos, entidades e sessões, ou utilize um código de convite para participar como jogador."
            actionLabel="Criar Nova Campanha"
            onAction={() => navigate("/campaigns/new")}
            icon={<FolderKanban className="w-6 h-6" />}
          />
        )}

        {!isLoading && !isError && campaigns && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((camp) => {
              const isGM = camp.user_role === "gm";

              return (
                <article
                  key={camp.id}
                  className="bg-white border border-[#E6E6EA] rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 flex flex-col overflow-hidden transition-all group"
                >
                  {/* Cabeçalho/Capa da Campanha */}
                  <div className="relative h-32 bg-[#FAFAFB] border-b border-[#E6E6EA] overflow-hidden">
                    {camp.cover_url ? (
                      <img
                        src={camp.cover_url}
                        alt={`Capa da campanha ${camp.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-[#FAFAFB] to-zinc-100">
                        <span className="text-4xl font-black text-zinc-200 select-none tracking-tight">
                          {camp.rpg_system.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white/90 backdrop-blur-sm text-[#C42A3C] border border-[#E6E6EA]">
                        {camp.rpg_system}
                      </span>
                      {camp.status === "archived" && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-100 text-zinc-600 border border-[#E6E6EA]">
                          Arquivada
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <RoleBadge role={camp.user_role} />
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-[#16151A] group-hover:text-[#C42A3C] transition-colors">
                        <Link to={`/campaigns/${camp.id}`}>{camp.name}</Link>
                      </h2>
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {camp.description || "Sem descrição cadastrada."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#E6E6EA]">
                      {/* Métricas Rápidas */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA]">
                          <div className="font-bold text-[#16151A] flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#FF4D5A]" />
                            {camp.entities_count}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Entidades
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA]">
                          <div className="font-bold text-[#16151A] flex items-center justify-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-[#FF4D5A]" />
                            {camp.sessions_count}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Sessões
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA]">
                          <div className="font-bold text-[#FF4D5A] flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#FF4D5A]" />
                            {camp.events_count}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Eventos
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>Atualizado em:</span>
                        <span className="font-medium text-zinc-600">
                          {formatDateTime(camp.updated_at)}
                        </span>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Link
                          to={`/campaigns/${camp.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <span>Acessar Campanha</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        {isGM && (
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/campaigns/${camp.id}/settings`}
                              title="Configurações da campanha"
                              className="p-2 rounded-xl border border-[#E6E6EA] bg-white hover:bg-[#FAFAFB] text-zinc-600 hover:text-[#16151A] transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                archiveMutation.mutate({
                                   id: camp.id,
                                   newStatus: camp.status === "active" ? "archived" : "active",
                                })
                              }
                              title={camp.status === "active" ? "Arquivar campanha" : "Reativar campanha"}
                              className="p-2 rounded-xl border border-[#E6E6EA] bg-white hover:bg-[#FAFAFB] text-zinc-600 hover:text-[#16151A] transition-colors"
                            >
                              {camp.status === "active" ? (
                                <Archive className="w-4 h-4" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCampaignToDelete(camp)}
                              title="Excluir campanha"
                              className="p-2 rounded-xl border border-[#E6E6EA] bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal para aceitar convite por token */}
      <DialogModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Ingressar em uma Campanha"
        subtitle="Insira o código ou token de convite fornecido pelo Mestre da campanha."
        maxWidthClass="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inviteToken.trim()) {
              acceptInviteMutation.mutate(inviteToken);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="invite-token-input"
              className="block text-xs uppercase tracking-wider font-semibold text-zinc-600 mb-1.5"
            >
              Token do Convite <span className="text-[#FF4D5A]">*</span>
            </label>
            <input
              id="invite-token-input"
              type="text"
              required
              autoFocus
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Cole aqui o token recebido..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E6EA]">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={acceptInviteMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {acceptInviteMutation.isPending ? "Ingressando..." : "Ingressar na Campanha"}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        isOpen={Boolean(campaignToDelete)}
        title="Excluir Campanha Permanentemente?"
        description={`Esta ação excluirá permanentemente a campanha "${campaignToDelete?.name}" e todos os seus acontecimentos, personagens e sessões vinculadas.`}
        isLoading={deleteMutation.isPending}
        confirmLabel="Sim, Excluir Campanha"
        onConfirm={() => {
          if (campaignToDelete) deleteMutation.mutate(campaignToDelete.id);
        }}
        onCancel={() => setCampaignToDelete(null)}
      />
    </div>
  );
};
