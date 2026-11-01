import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Copy,
  Check,
  Trash2,
  Mail,
  Ticket,
  Shield,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import { CampaignInvitation, CampaignMember } from "../../types";
import {
  LoadingState,
  ErrorState,
  RoleBadge,
} from "../../components/ui/StateViews";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { formatDateTime } from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

export const CampaignMembersPage: React.FC = () => {
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [inviteEmail, setInviteEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [generatedInvitation, setGeneratedInvitation] = useState<CampaignInvitation | null>(
    null
  );
  const [copiedType, setCopiedType] = useState<"token" | "link" | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<CampaignMember | null>(null);

  const {
    data: members,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["members", campaign.id],
    queryFn: () => apiRequest<CampaignMember[]>(`/campaigns/${campaign.id}/members`),
  });

  const { data: invitations } = useQuery({
    queryKey: ["invitations", campaign.id],
    queryFn: () =>
      apiRequest<CampaignInvitation[]>(`/campaigns/${campaign.id}/invitations`),
    enabled: isGM,
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiRequest<CampaignInvitation>(`/campaigns/${campaign.id}/invitations`, {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail.trim() || null,
          expires_in_days: Number(expiresInDays),
        }),
      }),
    onSuccess: (inv) => {
      setGeneratedInvitation(inv);
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["invitations", campaign.id] });
      showToast("Convite gerado com sucesso! Copie o código ou link abaixo.", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao gerar convite.", "error");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest<void>(`/campaigns/${campaign.id}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      setMemberToRemove(null);
      queryClient.invalidateQueries({ queryKey: ["members", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      showToast("Participante removido da campanha.", "info");
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao remover participante.", "error");
    },
  });

  const copyToClipboard = async (text: string, type: "token" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      showToast("Copiado para a área de transferência!", "success");
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      showToast("Não foi possível copiar automaticamente.", "error");
    }
  };

  if (isLoading) {
    return <LoadingState message="Carregando participantes da campanha..." />;
  }

  if (isError || !members) {
    return (
      <ErrorState
        message={(error as Error)?.message || "Erro ao carregar participantes."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b-2 border-[#111111]">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF4D5A]">
          CONTROLE DE ACESSO E MESA
        </span>
        <h1 className="font-display text-3xl font-bold uppercase text-[#111111] mt-1">
          Participantes da Campanha
        </h1>
        <p className="text-sm text-[#111111]/75 mt-1">
          Veja quem participa desta campanha e seu respectivo papel de acesso.
        </p>
      </div>

      {/* Geração de convites (Exclusivo para o Mestre) */}
      {isGM && (
        <section className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-display text-lg font-semibold text-zinc-100">
                Convidar Jogador para a Campanha
              </h2>
              <p className="text-xs text-zinc-400">
                Gere um token de convite vinculado a um e-mail específico ou um código aberto para
                qualquer jogador.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label
                htmlFor="inv-email"
                className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                E-mail do Convidado (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="inv-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Deixe em branco para convite por código aberto"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="inv-days"
                className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Validade
              </label>
              <select
                id="inv-days"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-xs"
              >
                <option value={1}>1 dia</option>
                <option value={7}>7 dias</option>
                <option value={30}>30 dias</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Ticket className="w-4 h-4" />
              {inviteMutation.isPending ? "Gerando..." : "Gerar Convite"}
            </button>
          </form>

          {generatedInvitation?.token && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold">
                Convite Gerado — Compartilhe com o Jogador:
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 px-3.5 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 font-mono text-xs text-zinc-100 select-all break-all">
                  {generatedInvitation.token}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedInvitation.token!, "token")}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-obsidian-950 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 text-xs font-mono shrink-0"
                >
                  {copiedType === "token" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copiar Token
                </button>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${window.location.origin}/invitations/${generatedInvitation.token}/accept`,
                      "link"
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-obsidian-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono shrink-0"
                >
                  {copiedType === "link" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copiar Link Direto
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Lista de Participantes Atuais */}
      <section className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Integrantes Ativos ({members.length})
        </h2>

        <div className="divide-y divide-zinc-800/80">
          {members.map((m) => (
            <div
              key={m.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                {m.user.avatar_url ? (
                  <img
                    src={m.user.avatar_url}
                    alt={m.user.name}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-display font-bold">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-display font-semibold text-sm text-zinc-100">
                    {m.user.name}{" "}
                    <span className="font-mono text-xs text-zinc-400 font-normal">
                      (@{m.user.username})
                    </span>
                  </div>
                  <div className="text-xs font-mono text-zinc-500">
                    {m.user.email} • Ingressou em {formatDateTime(m.joined_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RoleBadge role={m.role} />
                {isGM && m.user_id !== campaign.owner_id && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(m)}
                    title="Remover participante da campanha"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-obsidian-950 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800 text-xs font-mono"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico de Convites Gerados (Mestre) */}
      {isGM && invitations && invitations.length > 0 && (
        <section className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-zinc-100">
            Histórico de Convites Emitidos ({invitations.length})
          </h2>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-xl bg-obsidian-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="text-zinc-300">
                  Destinatário:{" "}
                  <span className="text-amber-300">
                    {inv.email || "Qualquer usuário com o código"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">
                    Expira em: {formatDateTime(inv.expires_at)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded uppercase text-[10px] ${
                      inv.status === "accepted"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : inv.status === "pending"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {inv.status === "accepted"
                      ? "Aceito"
                      : inv.status === "pending"
                      ? "Pendente"
                      : inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        isOpen={!!memberToRemove}
        title="Remover Participante?"
        description={
          memberToRemove
            ? `Tem certeza que deseja remover "${memberToRemove.user.name}" desta campanha? Ele perderá o acesso aos registros da campanha.`
            : ""
        }
        confirmLabel="Sim, Remover"
        isLoading={removeMemberMutation.isPending}
        onConfirm={() => {
          if (memberToRemove) {
            removeMemberMutation.mutate(memberToRemove.user_id);
          }
        }}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
};
