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
  RpgSystemBadge,
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
      <div className="pb-6 border-b border-[#E6E6EA]">
        <div className="flex flex-wrap items-center gap-2">
          <RpgSystemBadge system={campaign.rpg_system} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#16151A] mt-3">
          Participantes da Campanha
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Veja quem participa desta campanha e seu respectivo papel de acesso.
        </p>
      </div>

      {/* Geração de convites (Exclusivo para o Mestre) */}
      {isGM && (
        <section className="rounded-2xl bg-white border border-[#E6E6EA] p-6 space-y-5 shadow-sm text-[#16151A]">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-[#FF4D5A]" />
            <div>
              <h2 className="text-lg font-bold text-[#16151A]">
                Convidar Jogador para a Campanha
              </h2>
              <p className="text-xs text-zinc-500">
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
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs focus:outline-none focus:border-[#FF4D5A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="inv-days"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Validade
              </label>
              <select
                id="inv-days"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-xs focus:outline-none focus:border-[#FF4D5A]"
              >
                <option value={1}>1 dia</option>
                <option value={7}>7 dias</option>
                <option value={30}>30 dias</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="py-2.5 px-4 rounded-xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all disabled:opacity-50"
            >
              <Ticket className="w-4 h-4" />
              {inviteMutation.isPending ? "Gerando..." : "Gerar Convite"}
            </button>
          </form>

          {generatedInvitation?.token && (
            <div className="p-4 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] space-y-3">
              <div className="text-xs font-semibold text-[#16151A]">
                Convite Gerado — Compartilhe com o Jogador:
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#E6E6EA] font-mono text-xs text-[#16151A] select-all break-all">
                  {generatedInvitation.token}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedInvitation.token!, "token")}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm shrink-0 transition-colors"
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
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm shrink-0 transition-colors"
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
      <section className="rounded-2xl bg-white border border-[#E6E6EA] p-6 space-y-4 shadow-sm text-[#16151A]">
        <h2 className="text-lg font-bold text-[#16151A] flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#FF4D5A]" />
          Integrantes Ativos ({members.length})
        </h2>

        <div className="divide-y divide-[#E6E6EA]">
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
                    className="w-10 h-10 rounded-full object-cover border border-[#E6E6EA]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#FF4D5A]/10 border border-[#FF4D5A]/20 flex items-center justify-center text-[#FF4D5A] font-bold">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-display font-semibold text-sm text-[#16151A]">
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
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
        <section className="rounded-2xl bg-white border border-[#E6E6EA] p-6 space-y-4 shadow-sm text-[#16151A]">
          <h2 className="text-base font-bold text-[#16151A]">
            Histórico de Convites Emitidos ({invitations.length})
          </h2>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="text-zinc-700">
                  Destinatário:{" "}
                  <span className="text-[#FF4D5A] font-semibold">
                    {inv.email || "Qualquer usuário com o código"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">
                    Expira em: {formatDateTime(inv.expires_at)}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full uppercase text-[10px] font-semibold border ${
                      inv.status === "accepted"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : inv.status === "pending"
                        ? "bg-[#FF4D5A]/10 text-[#C42A3C] border-[#FF4D5A]/20"
                        : "bg-zinc-100 text-zinc-600 border-[#E6E6EA]"
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
