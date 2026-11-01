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
    <div className="min-h-screen bg-[#16332c] text-[#fffdf4] flex flex-col justify-center items-center px-4 py-12 bg-dossier-grid">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="brand justify-center mb-5">
            <span className="brand-mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="brand-text !text-[#fffdf4] text-left">
              CRÔNICA
              <strong className="text-[#d8ff72]">ARQUIVO RPG</strong>
            </span>
          </Link>
          <div className="eyebrow text-[#d8ff72] flex items-center justify-center gap-2 mb-2">
            <span className="pulse-dot" aria-hidden="true" />
            AUTENTICAÇÃO DE USUÁRIO
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-[-0.06em] text-[#fffdf4]">
            ACESSAR <em className="not-italic text-[#d8ff72]">ARQUIVO.</em>
          </h1>
        </div>

        <div className="bg-[#fffdf4] text-[#172e28] border-2 border-[#172e28] p-6 sm:p-8 shadow-[8px_8px_0_#0b1c17]">
          {serverError && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-[#ffd2bb] border-2 border-[#172e28] text-xs font-bold text-[#172e28]"
            >
              {serverError}
            </div>
          )}

          {/* modern-web-guidance: autofill-sign-in-form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-[#172e28] mb-2"
              >
                E-mail <span className="text-[#fa775d]">*</span>
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
                className="w-full px-3.5 py-2.5 bg-[#f6f1e4] border-2 border-[#172e28] text-[#172e28] text-sm font-medium focus:outline-none focus:bg-[#fffdf4]"
              />
              {errors.email && (
                <p className="text-xs font-bold text-[#fa775d] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-[#172e28]"
                >
                  Senha <span className="text-[#fa775d]">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-mono font-bold uppercase text-[#172e28] underline hover:text-[#fa775d]"
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
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#f6f1e4] border-2 border-[#172e28] text-[#172e28] text-sm font-medium focus:outline-none focus:bg-[#fffdf4]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#172e28]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-bold text-[#fa775d] mt-1">{errors.password.message}</p>
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

          <div className="mt-6 pt-5 border-t-2 border-[#172e28] text-center text-sm text-[#172e28]">
            Ainda não possui uma conta?{" "}
            <Link
              to="/register"
              className="font-bold uppercase underline hover:text-[#fa775d]"
            >
              Cadastre-se gratuitamente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
