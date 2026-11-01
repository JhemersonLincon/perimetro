import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket, CheckCircle2, ArrowLeft } from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { apiRequest } from "../../services/api";
import { Campaign } from "../../types";
import { useToast } from "../../contexts/ToastContext";

export const AcceptInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const acceptMutation = useMutation({
    mutationFn: () =>
      apiRequest<Campaign>(`/invitations/${encodeURIComponent(token || "")}/accept`, {
        method: "POST",
      }),
    onSuccess: (camp) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      showToast(`Convite aceito! Bem-vindo à campanha "${camp.name}".`, "success");
      navigate(`/campaigns/${camp.id}`);
    },
    onError: (err: any) => {
      showToast(err.message || "Falha ao aceitar convite.", "error");
    },
  });

  return (
    <div className="min-h-screen bg-[#EFEAE2] text-[#111111] flex flex-col bg-dossier-grid">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-obsidian-900 text-zinc-100 border-2 border-[#111111] p-8 text-center shadow-[6px_6px_0_#FF4D5A] space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-100">
            Convite para Participar de Campanha
          </h1>
          <p className="text-sm text-zinc-400">
            Confirme abaixo para vincular sua conta como Jogador nesta campanha.
          </p>

          {acceptMutation.isError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200"
            >
              {(acceptMutation.error as Error)?.message}
            </div>
          )}

          <button
            type="button"
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {acceptMutation.isPending ? "Validando convite..." : "Aceitar Convite e Acessar"}
          </button>

          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-zinc-400 hover:text-amber-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para Minhas Campanhas
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
