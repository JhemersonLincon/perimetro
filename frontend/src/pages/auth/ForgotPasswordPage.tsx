import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import { apiRequest } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { ThemeToggleButton } from "../../components/ui/ThemeToggleButton";

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Informe seu endereço de e-mail.");
      return;
    }
    setIsLoading(true);
    try {
      const resp = await apiRequest<{ message: string; reset_token?: string }>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        }
      );
      if (resp.reset_token) {
        setResetToken(resp.reset_token);
      }
      setStep("reset");
      showToast(resp.message, "info");
    } catch (err: any) {
      setError(err.message || "Erro ao solicitar recuperação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resetToken.trim() || newPassword.length < 6) {
      setError("Informe o token de recuperação e uma nova senha de pelo menos 6 caracteres.");
      return;
    }
    setIsLoading(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: resetToken.trim(),
          new_password: newPassword,
        }),
      });
      showToast("Senha redefinida com sucesso!", "success");
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Falha ao redefinir a senha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEAE2] text-[#111111] flex flex-col justify-center items-center px-4 py-12 bg-dossier-grid relative">
      <div className="w-full max-w-md flex justify-end mb-4">
        <ThemeToggleButton />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded bg-[#16151A] border-2 border-[#111111] shadow-[3px_3px_0_#FF4D5A] flex items-center justify-center text-[#FF4D5A]">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-2xl text-[#111111] tracking-tight">
              CRÔNICA
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold uppercase text-[#111111]">
            Recuperação de Credencial
          </h1>
          <p className="text-sm text-[#111111]/75 mt-1">
            Redefina sua senha de acesso à plataforma.
          </p>
        </div>

        <div className="rounded bg-obsidian-900 text-zinc-100 border-2 border-[#111111] p-6 sm:p-8 shadow-[8px_8px_0_#FF4D5A]">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200"
            >
              {error}
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2"
                >
                  E-mail da Conta <span className="text-amber-400">*</span>
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                {isLoading ? "Gerando código..." : "Solicitar Código de Recuperação"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                Código de recuperação gerado. Confirme o token abaixo e defina sua nova senha.
              </div>
              <div>
                <label
                  htmlFor="reset-token"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Token de Recuperação <span className="text-amber-400">*</span>
                </label>
                <input
                  id="reset-token"
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Nova Senha <span className="text-amber-400">*</span>
                </label>
                <input
                  id="reset-new-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLoading ? "Salvando..." : "Redefinir Senha"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-amber-400"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
