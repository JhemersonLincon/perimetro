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
    <div className="min-h-screen bg-[#f6f1e4] text-[#172e28] flex flex-col">
      <Navbar />

      {/* Hero Editorial do Painel */}
      <section className="bg-[#16332c] text-[#fffdf4] border-b-2 border-[#172e28] py-12 sm:py-16">
        <div className="wrap flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="eyebrow text-[#d8ff72] flex items-center gap-2.5 mb-3">
              <span className="pulse-dot" aria-hidden="true" />
              01 / PAINEL CENTRAL DO USUÁRIO
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-[-0.07em] leading-[0.94]">
              MINHAS <em className="not-italic text-[#d8ff72]">CAMPANHAS</em>
              <span className="text-[#fa775d]">.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#e2e9d8] mt-3 max-w-2xl">
              Gerencie os arquivos narrativos que você mestra ou acompanhe as linhas do tempo em que
              atua como jogador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="ref-button ref-button-paper"
            >
              <span className="inline-flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#fa775d]" />
                Aceitar Convite
              </span>
              <span aria-hidden="true">✳</span>
            </button>
            <Link to="/campaigns/new" className="ref-button ref-button-lime">
              <span className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Campanha
              </span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1 wrap py-10">
        {/* Filtros de Status Brutalistas */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b-2 border-[#172e28]">
          <span className="section-index flex items-center gap-2 text-[#172e28]">
            <span className="text-[#fa775d] text-base">✳</span>
            02 / ARQUIVOS REGISTRADOS
          </span>

          <div className="flex items-center gap-2">
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
                className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#172e28] transition-all ${statusFilter === tab.key
                    ? "bg-[#d8ff72] text-[#172e28] shadow-[3px_3px_0_#172e28]"
                    : "bg-[#fffdf4] text-[#172e28] hover:bg-[#ffd2bb]"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {campaigns.map((camp, idx) => {
              const isGM = camp.user_role === "gm";
              const accentBgs = ["bg-[#d8ff72]", "bg-[#ffd2bb]", "bg-[#fa775d]"];
              const headerBg = accentBgs[idx % accentBgs.length];

              return (
                <article
                  key={camp.id}
                  className="bg-[#fffdf4] text-[#172e28] border-2 border-[#172e28] shadow-[8px_8px_0_#172e28] flex flex-col overflow-hidden transition-transform hover:-translate-y-1"
                >
                  {/* Cabeçalho/Capa da Campanha */}
                  <div
                    className={`relative h-36 ${headerBg} border-b-2 border-[#172e28] overflow-hidden`}
                  >
                    {camp.cover_url ? (
                      <img
                        src={camp.cover_url}
                        alt={`Capa da campanha ${camp.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-end justify-between p-4">
                        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#172e28]/80">
                          DOSSIÊ #{String(idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          aria-hidden="true"
                          className="font-display text-7xl font-bold leading-none tracking-tighter text-[#172e28]/15 select-none"
                        >
                          RPG
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#172e28] text-[#fffdf4]">
                        {camp.rpg_system}
                      </span>
                      {camp.status === "archived" && (
                        <span className="px-2 py-1 text-[10px] font-mono font-bold uppercase bg-[#fffdf4] text-[#172e28] border border-[#172e28]">
                          Arquivada
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <RoleBadge role={camp.user_role} />
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="font-display text-2xl font-bold uppercase tracking-[-0.04em] text-[#172e28] hover:underline">
                        <Link to={`/campaigns/${camp.id}`}>{camp.name}</Link>
                      </h2>
                      <p className="text-sm text-[#172e28]/80 mt-2 line-clamp-3 leading-relaxed">
                        {camp.description || "Sem descrição cadastrada."}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t-2 border-[#172e28] space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-[#f6f1e4] border border-[#172e28]">
                          <div className="font-mono text-base font-bold text-[#172e28] flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#fa775d]" />
                            {camp.entities_count}
                          </div>
                          <div className="text-[10px] font-mono uppercase text-[#172e28]/70">
                            Entidades
                          </div>
                        </div>

                        <div className="p-2 bg-[#f6f1e4] border border-[#172e28]">
                          <div className="font-mono text-base font-bold text-[#172e28] flex items-center justify-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-[#fa775d]" />
                            {camp.sessions_count}
                          </div>
                          <div className="text-[10px] font-mono uppercase text-[#172e28]/70">
                            Sessões
                          </div>
                        </div>

                        <div className="p-2 bg-[#f6f1e4] border border-[#172e28]">
                          <div className="font-mono text-base font-bold text-[#172e28] flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#fa775d]" />
                            {camp.events_count}
                          </div>
                          <div className="text-[10px] font-mono uppercase text-[#172e28]/70">
                            Eventos
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-[#172e28]/70 flex items-center justify-between">
                        <span>ATUALIZADO EM:</span>
                        <span className="font-bold text-[#172e28]">
                          {formatDateTime(camp.updated_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <Link
                          to={`/campaigns/${camp.id}`}
                          className="flex-1 inline-flex items-center justify-between px-3.5 py-2.5 bg-[#d8ff72] hover:bg-[#c8f550] text-[#172e28] border-2 border-[#172e28] shadow-[3px_3px_0_#172e28] font-display font-bold uppercase text-xs transition-all"
                        >
                          <span>Acessar Campanha</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>

                        {isGM && (
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/campaigns/${camp.id}/settings`}
                              title="Editar configurações"
                              aria-label={`Configurações da campanha ${camp.name}`}
                              className="p-2.5 bg-[#fffdf4] hover:bg-[#ffd2bb] text-[#172e28] border-2 border-[#172e28] shadow-[2px_2px_0_#172e28] transition-colors"
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
                              title={
                                camp.status === "active"
                                  ? "Arquivar campanha"
                                  : "Reativar campanha"
                              }
                              aria-label={
                                camp.status === "active"
                                  ? `Arquivar campanha ${camp.name}`
                                  : `Reativar campanha ${camp.name}`
                              }
                              className="p-2.5 bg-[#fffdf4] hover:bg-[#d8ff72] text-[#172e28] border-2 border-[#172e28] shadow-[2px_2px_0_#172e28] transition-colors"
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
                              aria-label={`Excluir campanha ${camp.name}`}
                              className="p-2.5 bg-[#fffdf4] hover:bg-[#fa775d] text-[#172e28] border-2 border-[#172e28] shadow-[2px_2px_0_#172e28] transition-colors"
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
              className="block text-xs font-mono uppercase tracking-wider text-zinc-200 mb-1.5"
            >
              Token do Convite <span className="text-amber-400">*</span>
            </label>
            <input
              id="invite-token-input"
              type="text"
              required
              autoFocus
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Cole aqui o token recebido..."
              className="w-full px-3.5 py-2.5 bg-obsidian-950 border-2 border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase bg-obsidian-800 text-zinc-200 border-2 border-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={acceptInviteMutation.isPending || !inviteToken.trim()}
              className="px-4 py-2 text-xs font-bold uppercase bg-amber-500 text-ink border-2 border-ink shadow-neo-sm disabled:opacity-50"
            >
              {acceptInviteMutation.isPending ? "Validando..." : "Aceitar Convite"}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Confirmação de exclusão de campanha */}
      <ConfirmDialog
        isOpen={!!campaignToDelete}
        title="Excluir Campanha Permanentemente?"
        description={
          campaignToDelete
            ? `Tem certeza que deseja excluir a campanha "${campaignToDelete.name}"? Todos os acontecimentos da linha do tempo, entidades, sessões e participantes associados serão permanentemente removidos.`
            : ""
        }
        confirmLabel="Sim, Excluir Campanha"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (campaignToDelete) {
            deleteMutation.mutate(campaignToDelete.id);
          }
        }}
        onCancel={() => setCampaignToDelete(null)}
      />
    </div>
  );
};
