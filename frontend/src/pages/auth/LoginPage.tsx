import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { apiRequest } from "../../services/api";
import { TokenResponse } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const loginSchema = z.object({
  email: z.string().email("Informe um endereço de e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const resp = await apiRequest<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      loginWithToken(resp);
      showToast(`Bem-vindo de volta, ${resp.user.name}!`, "success");
      navigate("/dashboard");
    } catch (err: any) {
      setServerError(err.message || "Falha ao autenticar.");
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEAE2] text-[#111111] flex flex-col justify-center items-center px-4 py-12 bg-dossier-grid">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="brand justify-center mb-5">
            <span className="brand-mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="brand-text !text-[#111111] text-left">
              CRÔNICA
              <strong className="text-[#FF4D5A]">ARQUIVO RPG</strong>
            </span>
          </Link>
          <div className="eyebrow text-[#111111] flex items-center justify-center gap-2 mb-2">
            <span className="pulse-dot" aria-hidden="true" />
            AUTENTICAÇÃO DE USUÁRIO
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-[-0.06em] text-[#111111]">
            ACESSAR <em className="not-italic text-[#FF4D5A]">ARQUIVO</em>
            <span className="text-[#111111]">.</span>
          </h1>
        </div>

        <div className="bg-[#FFFFFF] text-[#111111] border-2 border-[#111111] p-6 sm:p-8 shadow-[8px_8px_0_#111111]">
          {serverError && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-[#EFEAE2] border-2 border-[#111111] text-xs font-bold text-[#111111]"
            >
              {serverError}
            </div>
          )}

          {/* modern-web-guidance: autofill-sign-in-form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-2"
              >
                E-mail <span className="text-[#FF4D5A]">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                enterKeyHint="next"
                required
                placeholder="mestre@cronica.rpg"
                {...register("email")}
                className="w-full px-3.5 py-2.5 bg-[#EFEAE2] border-2 border-[#111111] text-[#111111] text-sm font-medium focus:outline-none focus:bg-[#FFFFFF]"
              />
              {errors.email && (
                <p className="text-xs font-bold text-[#FF4D5A] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111]"
                >
                  Senha <span className="text-[#FF4D5A]">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-mono font-bold uppercase text-[#111111] underline hover:text-[#FF4D5A]"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#EFEAE2] border-2 border-[#111111] text-[#111111] text-sm font-medium focus:outline-none focus:bg-[#FFFFFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#111111]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-bold text-[#FF4D5A] mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full ref-button ref-button-lime justify-center disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? "Autenticando..." : "Entrar na Plataforma"}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t-2 border-[#111111] text-center text-sm text-[#111111]">
            Ainda não possui uma conta?{" "}
            <Link
              to="/register"
              className="font-bold uppercase underline hover:text-[#FF4D5A]"
            >
              Cadastre-se gratuitamente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
