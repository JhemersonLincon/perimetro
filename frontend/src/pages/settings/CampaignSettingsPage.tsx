import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2, Plus, Calendar, AlertTriangle } from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import { Campaign } from "../../types";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../contexts/ToastContext";

const settingsSchema = z.object({
  name: z.string().min(2, "Informe o nome da campanha."),
  description: z.string().min(1, "Informe a descrição da campanha."),
  rpg_system: z.string().min(1, "Informe o sistema de RPG."),
  cover_url: z.string().optional(),
  start_date: z.string().optional(),
  status: z.enum(["active", "archived"]),
  calendar_type: z.enum(["gregorian", "fictional"]),
  era_name: z.string().optional(),
  months: z
    .array(
      z.object({
        name: z.string().min(1, "Nome obrigatório"),
        days: z.coerce.number().min(1).max(500),
      })
    )
    .min(1),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export const CampaignSettingsPage: React.FC = () => {
  const { campaign, isGM, refetchCampaign } = useOutletContext<CampaignOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: campaign.name,
      description: campaign.description,
      rpg_system: campaign.rpg_system,
      cover_url: campaign.cover_url || "",
      start_date: campaign.start_date || "",
      status: campaign.status,
      calendar_type: campaign.calendar_config?.type || "gregorian",
      era_name: campaign.calendar_config?.era_name || "d.C.",
      months: campaign.calendar_config?.months || [{ name: "Janeiro", days: 31 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "months",
  });

  const calendarType = watch("calendar_type");

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest<void>(`/campaigns/${campaign.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      showToast("Campanha excluída permanentemente.", "success");
      navigate("/dashboard");
    },
    onError: (err: any) => {
      showToast(err.message || "Erro ao excluir campanha.", "error");
    },
  });

  if (!isGM) {
    return (
      <div className="p-8 rounded-2xl bg-obsidian-900 border border-zinc-800 text-center">
        <p className="text-sm text-zinc-400">
          Apenas o Mestre (GM) da campanha possui permissão para alterar configurações.
        </p>
      </div>
    );
  }

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await apiRequest<Campaign>(`/campaigns/${campaign.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          rpg_system: values.rpg_system,
          cover_url: values.cover_url?.trim() || null,
          start_date: values.start_date || null,
          status: values.status,
          calendar_config: {
            type: values.calendar_type,
            era_name: values.era_name || "d.C.",
            months: values.months,
          },
        }),
      });
      refetchCampaign();
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["events", campaign.id] });
      showToast("Configurações da campanha atualizadas com sucesso!", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao salvar configurações.", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-zinc-800">
        <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
          ADMINISTRAÇÃO DO DOSSIÊ
        </span>
        <h1 className="font-display text-3xl font-bold text-zinc-100 mt-1">
          Configurações da Campanha
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Altere metadados, sistema de RPG, estrutura do calendário narrativo ou status de
          arquivamento.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="set-name"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Nome da Campanha <span className="text-amber-400">*</span>
            </label>
            <input
              id="set-name"
              type="text"
              {...register("name")}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm"
            />
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="set-system"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Sistema de RPG <span className="text-amber-400">*</span>
            </label>
            <input
              id="set-system"
              type="text"
              {...register("rpg_system")}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="set-status"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Status
            </label>
            <select
              id="set-status"
              {...register("status")}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm"
            >
              <option value="active">Ativa</option>
              <option value="archived">Arquivada</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="set-start"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Data de Início
            </label>
            <input
              id="set-start"
              type="date"
              {...register("start_date")}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="set-cover"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              URL da Imagem de Capa
            </label>
            <input
              id="set-cover"
              type="url"
              {...register("cover_url")}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="set-desc"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Descrição <span className="text-amber-400">*</span>
            </label>
            <textarea
              id="set-desc"
              rows={4}
              {...register("description")}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm"
            />
          </div>
        </div>

        {/* Calendário */}
        <div className="pt-4 border-t border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Calendário Narrativo da Campanha
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="set-cal-type"
                className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Modalidade do Calendário
              </label>
              <select
                id="set-cal-type"
                {...register("calendar_type")}
                className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm"
              >
                <option value="gregorian">Convencional (Gregoriano)</option>
                <option value="fictional">Fictício Personalizado</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="set-era"
                className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Sigla da Era
              </label>
              <input
                id="set-era"
                type="text"
                {...register("era_name")}
                className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm font-mono"
              />
            </div>
          </div>

          {calendarType === "fictional" && (
            <div className="p-4 rounded-xl bg-obsidian-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-zinc-400">
                  Meses do Calendário Fictício
                </span>
                <button
                  type="button"
                  onClick={() => append({ name: `Mês ${fields.length + 1}`, days: 30 })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Mês
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 font-mono text-xs text-zinc-500">#{index + 1}</div>
                    <div className="col-span-7">
                      <input
                        type="text"
                        {...register(`months.${index}.name` as const)}
                        className="w-full px-3 py-1.5 rounded bg-obsidian-900 border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        {...register(`months.${index}.days` as const)}
                        className="w-full px-3 py-1.5 rounded bg-obsidian-900 border border-zinc-800 text-xs font-mono text-zinc-100"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>

      {/* Zona de Exclusão */}
      <section className="rounded-2xl bg-rose-950/15 border border-rose-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-100">
              Excluir Campanha Permanentemente
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              A exclusão removerá definitivamente todos os acontecimentos, entidades, sessões e
              vínculos de participantes desta campanha.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-semibold text-xs shrink-0 transition-colors"
        >
          Excluir Campanha
        </button>
      </section>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Excluir Campanha Permanentemente?"
        description={`Tem certeza absoluta que deseja excluir a campanha "${campaign.name}" e todos os seus registros dependentes?`}
        confirmLabel="Sim, Excluir Permanentemente"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};
