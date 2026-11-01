import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { apiRequest } from "../../services/api";
import { TokenResponse } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const registerSchema = z.object({
  name: z.string().min(2, "O nome de exibição deve ter pelo menos 2 caracteres."),
  username: z
    .string()
    .min(3, "O nome de usuário deve ter pelo menos 3 caracteres.")
    .max(60, "Máximo de 60 caracteres."),
  email: z.string().email("Informe um endereço de e-mail válido."),
  password: z.string().min(6, "A senha deve possuir no mínimo 6 caracteres."),
  avatar_url: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const resp = await apiRequest<TokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          avatar_url: values.avatar_url?.trim() || null,
        }),
      });
      loginWithToken(resp);
      showToast("Conta criada com sucesso!", "success");
      navigate("/dashboard");
    } catch (err: any) {
      setServerError(err.message || "Não foi possível concluir o cadastro.");
    }
  };

  return (
    <div className="min-h-screen bg-[#16151A] text-[#FFFFFF] flex flex-col justify-center items-center px-4 py-12 bg-dossier-grid">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="brand justify-center mb-5">
            <span className="brand-mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="brand-text !text-[#FFFFFF] text-left">
              CRÔNICA
              <strong className="text-[#FF4D5A]">ARQUIVO RPG</strong>
            </span>
          </Link>
          <div className="eyebrow text-[#FF4D5A] flex items-center justify-center gap-2 mb-2">
            <span className="pulse-dot" aria-hidden="true" />
            NOVO CADASTRO NA PLATAFORMA
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-[-0.06em] text-[#FFFFFF]">
            CRIAR <em className="not-italic text-[#FF4D5A]">CONTA</em>
            <span className="text-[#FFFFFF]">.</span>
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

          {/* modern-web-guidance: autofill-sign-up-form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5"
              >
                Nome de Exibição <span className="text-[#FF4D5A]">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                required
                placeholder="Ex: Helena Vance"
                {...register("name")}
                className="w-full px-3.5 py-2.5 bg-[#EFEAE2] border-2 border-[#111111] text-[#111111] text-sm font-medium focus:outline-none focus:bg-[#FFFFFF]"
              />
              {errors.name && (
                <p className="text-xs font-bold text-[#FF4D5A] mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-username"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5"
              >
                Nome de Usuário <span className="text-[#FF4D5A]">*</span>
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                enterKeyHint="next"
                required
                placeholder="Ex: helena_gm"
                {...register("username")}
                className="w-full px-3.5 py-2.5 bg-[#EFEAE2] border-2 border-[#111111] text-[#111111] text-sm font-medium focus:outline-none focus:bg-[#FFFFFF]"
              />
              {errors.username && (
                <p className="text-xs font-bold text-[#FF4D5A] mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5"
              >
                E-mail <span className="text-[#FF4D5A]">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                enterKeyHint="next"
                required
                placeholder="helena@cronica.rpg"
                {...register("email")}
                className="w-full px-3.5 py-2.5 bg-[#EFEAE2] border-2 border-[#111111] text-[#111111] text-sm font-medium focus:outline-none focus:bg-[#FFFFFF]"
              />
              {errors.email && (
                <p className="text-xs font-bold text-[#FF4D5A] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5"
              >
                Senha <span className="text-[#FF4D5A]">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  required
                  placeholder="Mínimo de 6 caracteres"
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

            <div>
              <label
                htmlFor="reg-avatar"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5"
              >
                URL da Foto de Perfil (Opcional)
              </label>
              <input
                id="reg-avatar"
                type="url"
                enterKeyHint="done"
                placeholder="https://exemplo.com/avatar.jpg"
                {...register("avatar_url")}
                className="w-full px-3.5 py-2.5 bg-[#EFEAE2] border-2 border-[#111111] text-[#111111] text-sm font-medium focus:outline-none focus:bg-[#FFFFFF]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full ref-button ref-button-lime justify-center disabled:opacity-50 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Criando conta..." : "Criar Conta"}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t-2 border-[#111111] text-center text-sm text-[#111111]">
            Já possui uma conta?{" "}
            <Link to="/login" className="font-bold uppercase underline hover:text-[#FF4D5A]">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
