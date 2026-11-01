import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, User as UserIcon, Calendar, Mail, Hash } from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiRequest } from "../../services/api";
import { User } from "../../types";
import { formatDateTime } from "../../utils/formatters";

const profileSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres."),
  avatar_url: z.string().optional(),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      avatar_url: user?.avatar_url || "",
      current_password: "",
      new_password: "",
    },
  });

  if (!user) return null;

  const onSubmit = async (values: ProfileFormValues) => {
    setServerError(null);
    try {
      const payload: Record<string, any> = {
        name: values.name,
        username: values.username,
        avatar_url: values.avatar_url || "",
      };
      if (values.new_password) {
        payload.current_password = values.current_password;
        payload.new_password = values.new_password;
      }
      const updated = await apiRequest<User>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await refreshUser();
      reset({
        name: updated.name,
        username: updated.username,
        avatar_url: updated.avatar_url || "",
        current_password: "",
        new_password: "",
      });
      showToast("Perfil atualizado com sucesso!", "success");
    } catch (err: any) {
      setServerError(err.message || "Erro ao atualizar perfil.");
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEAE2] text-[#111111] flex flex-col bg-dossier-grid">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 pb-4 border-b-2 border-[#111111]">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF4D5A]">
            CREDENCIAL DO USUÁRIO
          </span>
          <h1 className="font-display text-3xl font-bold uppercase text-[#111111] mt-1">
            Meu Perfil
          </h1>
          <p className="text-sm text-[#111111]/75 mt-1">
            Visualize e gerencie suas informações de identificação na plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 rounded-xl bg-obsidian-900 border-2 border-[#111111] shadow-[4px_4px_0_#FF4D5A] flex items-center gap-3">
            <Hash className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-zinc-400">ID Único</div>
              <div className="text-xs font-mono text-zinc-100 truncate" title={user.id}>
                {user.id}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-obsidian-900 border-2 border-[#111111] shadow-[4px_4px_0_#FF4D5A] flex items-center gap-3">
            <Mail className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-zinc-400">E-mail</div>
              <div className="text-xs font-mono text-zinc-100 truncate">{user.email}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-obsidian-900 border-2 border-[#111111] shadow-[4px_4px_0_#FF4D5A] flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-zinc-400">Conta criada em</div>
              <div className="text-xs font-mono text-zinc-100">
                {formatDateTime(user.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-obsidian-900 text-zinc-100 border-2 border-[#111111] shadow-[6px_6px_0_#FF4D5A] p-6 sm:p-8">
          {serverError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex items-center gap-4 pb-5 border-b border-zinc-800">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`Foto de perfil de ${user.name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 font-display text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-display font-semibold text-lg text-zinc-100">{user.name}</h2>
                <p className="font-mono text-xs text-zinc-400">@{user.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prof-name"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Nome de Exibição <span className="text-amber-400">*</span>
                </label>
                <input
                  id="prof-name"
                  type="text"
                  {...register("name")}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
                {errors.name && (
                  <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prof-username"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Nome de Usuário <span className="text-amber-400">*</span>
                </label>
                <input
                  id="prof-username"
                  type="text"
                  spellCheck={false}
                  {...register("username")}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
                {errors.username && (
                  <p className="text-xs text-rose-400 mt-1">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="prof-avatar"
                className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                URL da Foto de Perfil
              </label>
              <input
                id="prof-avatar"
                type="url"
                placeholder="https://exemplo.com/minha-foto.jpg"
                {...register("avatar_url")}
                className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <h3 className="font-display text-sm font-semibold text-zinc-200 mb-3">
                Alterar Senha (Opcional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="prof-curr-pwd"
                    className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5"
                  >
                    Senha Atual
                  </label>
                  <input
                    id="prof-curr-pwd"
                    type="password"
                    autoComplete="current-password"
                    {...register("current_password")}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prof-new-pwd"
                    className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5"
                  >
                    Nova Senha
                  </label>
                  <input
                    id="prof-new-pwd"
                    type="password"
                    autoComplete="new-password"
                    {...register("new_password")}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
