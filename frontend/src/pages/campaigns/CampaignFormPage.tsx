import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Plus, Trash2, Calendar, Save } from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { apiRequest } from "../../services/api";
import { Campaign } from "../../types";
import { useToast } from "../../contexts/ToastContext";

const campaignFormSchema = z.object({
  name: z.string().min(2, "Informe o nome da campanha (mín. 2 caracteres)."),
  description: z.string().min(1, "Informe uma descrição para a campanha."),
  rpg_system: z.string().min(1, "Informe o sistema de RPG utilizado."),
  cover_url: z.string().optional(),
  start_date: z.string().optional(),
  status: z.enum(["active", "archived"]),
  calendar_type: z.enum(["gregorian", "fictional"]),
  era_name: z.string().optional(),
  months: z
    .array(
      z.object({
        name: z.string().min(1, "Informe o nome do mês."),
        days: z.coerce.number().min(1, "Mínimo de 1 dia.").max(500, "Máximo de 500 dias."),
      })
    )
    .min(1, "Configure pelo menos 1 mês no calendário."),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const DEFAULT_GREGORIAN_MONTHS = [
  { name: "Janeiro", days: 31 },
  { name: "Fevereiro", days: 28 },
  { name: "Março", days: 31 },
  { name: "Abril", days: 30 },
  { name: "Maio", days: 31 },
  { name: "Junho", days: 30 },
  { name: "Julho", days: 31 },
  { name: "Agosto", days: 31 },
  { name: "Setembro", days: 30 },
  { name: "Outubro", days: 31 },
  { name: "Novembro", days: 30 },
  { name: "Dezembro", days: 31 },
];

const DEFAULT_FICTIONAL_MONTHS = [
  { name: "Brumário", days: 30 },
  { name: "Solstício", days: 30 },
  { name: "Cinzas", days: 30 },
  { name: "Colheita", days: 30 },
];

export const CampaignFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      description: "",
      rpg_system: "Call of Cthulhu",
      cover_url: "",
      start_date: new Date().toISOString().slice(0, 10),
      status: "active",
      calendar_type: "gregorian",
      era_name: "d.C.",
      months: DEFAULT_GREGORIAN_MONTHS,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "months",
  });

  const calendarType = watch("calendar_type");

  const handleSwitchCalendarType = (type: "gregorian" | "fictional") => {
    setValue("calendar_type", type);
    if (type === "gregorian") {
      setValue("era_name", "d.C.");
      replace(DEFAULT_GREGORIAN_MONTHS);
    } else {
      setValue("era_name", "E.I.");
      replace(DEFAULT_FICTIONAL_MONTHS);
    }
  };

  const onSubmit = async (values: CampaignFormValues) => {
    setServerError(null);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        rpg_system: values.rpg_system,
        cover_url: values.cover_url?.trim() || null,
        start_date: values.start_date || null,
        status: values.status,
        calendar_config: {
          type: values.calendar_type,
          era_name: values.era_name || (values.calendar_type === "fictional" ? "E.I." : "d.C."),
          months: values.months,
        },
      };
      const created = await apiRequest<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast(`Campanha "${created.name}" criada com sucesso!`, "success");
      navigate(`/campaigns/${created.id}`);
    } catch (err: any) {
      setServerError(err.message || "Falha ao criar campanha.");
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEAE2] text-[#111111] flex flex-col bg-dossier-grid">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#111111] hover:text-[#FF4D5A] mb-6"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF4D5A]" />
          Voltar para Minhas Campanhas
        </Link>

        <div className="mb-8 pb-4 border-b-2 border-[#111111]">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF4D5A]">
            NOVO DOSSIÊ NARRATIVO
          </span>
          <h1 className="font-display text-3xl font-bold uppercase text-[#111111] mt-1">
            Cadastrar Nova Campanha
          </h1>
          <p className="text-sm text-[#111111]/75 mt-1">
            Defina as informações básicas e o calendário que regerá a ordenação cronológica dos
            acontecimentos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-8 rounded-2xl bg-obsidian-900 text-zinc-100 border-2 border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0_#FF4D5A]"
        >
          {serverError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200"
            >
              {serverError}
            </div>
          )}

          {/* Dados gerais */}
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-zinc-100 pb-2 border-b border-zinc-800">
              1. Identificação da Campanha
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="camp-name"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Nome da Campanha <span className="text-amber-400">*</span>
                </label>
                <input
                  id="camp-name"
                  type="text"
                  placeholder="Ex: Crônicas de Valen: O Arquivo Subterrâneo"
                  {...register("name")}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
                {errors.name && (
                  <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="camp-system"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Sistema de RPG Utilizado <span className="text-amber-400">*</span>
                </label>
                <input
                  id="camp-system"
                  type="text"
                  placeholder="Ex: Call of Cthulhu 7e, D&D 5e, Ordem Paranormal..."
                  {...register("rpg_system")}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
                {errors.rpg_system && (
                  <p className="text-xs text-rose-400 mt-1">{errors.rpg_system.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="camp-start-date"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Data de Início (Real)
                </label>
                <input
                  id="camp-start-date"
                  type="date"
                  {...register("start_date")}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="camp-description"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Descrição e Premissa Narrativa <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="camp-description"
                  rows={4}
                  placeholder="Descreva o contexto histórico, ambientação e objetivo central da campanha..."
                  {...register("description")}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
                {errors.description && (
                  <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="camp-cover"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  URL da Imagem de Capa (Opcional)
                </label>
                <input
                  id="camp-cover"
                  type="url"
                  placeholder="https://exemplo.com/capa.jpg"
                  {...register("cover_url")}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="camp-status"
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Status da Campanha
                </label>
                <select
                  id="camp-status"
                  {...register("status")}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="active">Ativa</option>
                  <option value="archived">Arquivada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuração de Calendário */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h2 className="font-display text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                2. Configuração do Calendário Narrativo
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSwitchCalendarType("gregorian")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  calendarType === "gregorian"
                    ? "bg-amber-500/15 border-amber-500/50 text-zinc-100"
                    : "bg-obsidian-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="font-display font-semibold text-sm text-zinc-100">
                  Calendário Convencional (Gregoriano)
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Utiliza os 12 meses padrão (Janeiro a Dezembro). Ideal para campanhas históricas,
                  modernas ou investigativas no mundo real.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchCalendarType("fictional")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  calendarType === "fictional"
                    ? "bg-amber-500/15 border-amber-500/50 text-zinc-100"
                    : "bg-obsidian-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="font-display font-semibold text-sm text-zinc-100">
                  Calendário Fictício Personalizado
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Configure livremente os nomes dos meses, quantidade de dias por mês e a sigla da
                  Era do seu cenário.
                </p>
              </button>
            </div>

            {calendarType === "fictional" && (
              <div className="p-5 rounded-xl bg-obsidian-950 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="max-w-xs">
                    <label
                      htmlFor="camp-era"
                      className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1"
                    >
                      Sigla ou Nome da Era
                    </label>
                    <input
                      id="camp-era"
                      type="text"
                      placeholder="Ex: E.I. (Era Imperial)"
                      {...register("era_name")}
                      className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-zinc-800 text-zinc-100 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => append({ name: `Mês ${fields.length + 1}`, days: 30 })}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-mono uppercase tracking-wider self-start sm:self-end"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Mês
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-mono uppercase text-zinc-500 px-1">
                    <div className="col-span-2">Ordem</div>
                    <div className="col-span-6">Nome do Mês</div>
                    <div className="col-span-3">Dias</div>
                    <div className="col-span-1"></div>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2 font-mono text-xs text-zinc-400 px-2">
                        #{index + 1}
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          aria-label={`Nome do mês ${index + 1}`}
                          {...register(`months.${index}.name` as const)}
                          className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-zinc-800 text-zinc-100 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={1}
                          max={500}
                          aria-label={`Dias do mês ${index + 1}`}
                          {...register(`months.${index}.days` as const)}
                          className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-zinc-800 text-zinc-100 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={`Remover mês ${index + 1}`}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30"
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

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Criando Campanha..." : "Criar Campanha"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
