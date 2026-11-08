import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, Calendar, Save } from "lucide-react";
import { Navbar } from "../../components/layout/Navbar";
import { CoverImageUpload } from "../../components/campaigns/CoverImageUpload";
import { apiRequest } from "../../services/api";
import { Campaign } from "../../types";
import { useToast } from "../../contexts/ToastContext";

const campaignFormSchema = z.object({
  name: z.string().min(2, "Informe o nome da campanha (mín. 2 caracteres)."),
  description: z.string().min(1, "Informe uma descrição para a campanha."),
  rpg_system: z.string().min(1, "Informe o sistema de RPG utilizado."),
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
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      description: "",
      rpg_system: "Call of Cthulhu",
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
    if (coverError) {
      return;
    }

    setServerError(null);
    try {
      let uploadedCoverUrl: string | null = null;
      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        const uploadResponse = await apiRequest<{ cover_url: string }>("/campaigns/cover", {
          method: "POST",
          body: formData,
        });
        uploadedCoverUrl = uploadResponse.cover_url;
      }

      const payload = {
        name: values.name,
        description: values.description,
        rpg_system: values.rpg_system,
        cover_url: uploadedCoverUrl,
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
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      showToast(`Campanha "${created.name}" criada com sucesso!`, "success");
      navigate(`/campaigns/${created.id}`);
    } catch (err: any) {
      setServerError(err.message || "Falha ao criar campanha.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#16151A] flex flex-col antialiased">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#16151A] mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#FF4D5A]" />
          Voltar para Minhas Campanhas
        </Link>

        <div className="mb-8 pb-6 border-b border-[#E6E6EA]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3.5 py-1 text-xs font-semibold rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20">
              NOVO DOSSIÊ NARRATIVO
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#16151A] mt-3">
            Cadastrar Nova Campanha
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Defina as informações básicas e o calendário que regerá a ordenação cronológica dos
            acontecimentos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-8 rounded-2xl bg-white text-[#16151A] border border-[#E6E6EA] p-6 sm:p-8 shadow-sm"
        >
          {serverError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
            >
              {serverError}
            </div>
          )}

          {/* Dados gerais */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#16151A] pb-2 border-b border-[#E6E6EA]">
              1. Identificação da Campanha
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="camp-name"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Nome da Campanha <span className="text-[#FF4D5A]">*</span>
                </label>
                <input
                  id="camp-name"
                  type="text"
                  required
                  placeholder="Ex: Crônicas de Valen: O Arquivo Subterrâneo"
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-describedby={errors.name ? "camp-name-error" : undefined}
                  {...register("name")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
                />
                {errors.name && (
                  <p id="camp-name-error" role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="camp-system"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Sistema de RPG Utilizado <span className="text-[#FF4D5A]">*</span>
                </label>
                <input
                  id="camp-system"
                  type="text"
                  required
                  placeholder="Ex: Call of Cthulhu 7e, D&D 5e, Ordem Paranormal..."
                  aria-invalid={errors.rpg_system ? "true" : undefined}
                  aria-describedby={errors.rpg_system ? "camp-system-error" : undefined}
                  {...register("rpg_system")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
                />
                {errors.rpg_system && (
                  <p id="camp-system-error" role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.rpg_system.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="camp-start-date"
                    className="block text-xs font-semibold text-zinc-700 mb-1.5"
                  >
                    Data de Início (Real)
                  </label>
                  <input
                    id="camp-start-date"
                    type="date"
                    {...register("start_date")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="camp-status"
                    className="block text-xs font-semibold text-zinc-700 mb-1.5"
                  >
                    Status da Campanha
                  </label>
                  <select
                    id="camp-status"
                    {...register("status")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
                  >
                    <option value="active">Ativa</option>
                    <option value="archived">Arquivada</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="camp-description"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Descrição e Premissa Narrativa <span className="text-[#FF4D5A]">*</span>
                </label>
                <textarea
                  id="camp-description"
                  rows={4}
                  required
                  placeholder="Descreva o contexto histórico, ambientação e objetivo central da campanha..."
                  aria-invalid={errors.description ? "true" : undefined}
                  aria-describedby={errors.description ? "camp-description-error" : undefined}
                  {...register("description")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm focus:outline-none focus:border-[#FF4D5A]"
                />
                {errors.description && (
                  <p id="camp-description-error" role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <CoverImageUpload
                  id="camp-cover-file"
                  file={coverFile}
                  error={coverError}
                  disabled={isSubmitting}
                  onFileChange={setCoverFile}
                  onError={setCoverError}
                />
              </div>
            </div>
          </div>

          {/* Configuração de Calendário */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E6EA]">
              <h2 className="text-lg font-bold text-[#16151A] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FF4D5A]" />
                2. Configuração do Calendário Narrativo
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSwitchCalendarType("gregorian")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  calendarType === "gregorian"
                    ? "bg-[#FF4D5A]/10 border-[#FF4D5A]/40 text-[#16151A] shadow-sm"
                    : "bg-[#FAFAFB] border-[#E6E6EA] text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <div className="font-bold text-sm text-[#16151A]">
                  Calendário Convencional (Gregoriano)
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Utiliza os 12 meses padrão (Janeiro a Dezembro). Ideal para campanhas históricas,
                  modernas ou investigativas no mundo real.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchCalendarType("fictional")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  calendarType === "fictional"
                    ? "bg-[#FF4D5A]/10 border-[#FF4D5A]/40 text-[#16151A] shadow-sm"
                    : "bg-[#FAFAFB] border-[#E6E6EA] text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <div className="font-bold text-sm text-[#16151A]">
                  Calendário Fictício Personalizado
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Configure livremente os nomes dos meses, quantidade de dias por mês e a sigla da
                  Era do seu cenário.
                </p>
              </button>
            </div>

            {calendarType === "fictional" && (
              <div className="p-5 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="max-w-xs">
                    <label
                      htmlFor="camp-era"
                      className="block text-xs font-semibold text-zinc-700 mb-1.5"
                    >
                      Sigla ou Nome da Era
                    </label>
                    <input
                      id="camp-era"
                      type="text"
                      placeholder="Ex: E.I. (Era Imperial)"
                      {...register("era_name")}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6E6EA] text-[#16151A] text-xs font-mono focus:outline-none focus:border-[#FF4D5A]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => append({ name: `Mês ${fields.length + 1}`, days: 30 })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm self-start sm:self-end transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF4D5A]" />
                    Adicionar Mês
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
                    <div className="col-span-2">Ordem</div>
                    <div className="col-span-6">Nome do Mês</div>
                    <div className="col-span-3">Dias</div>
                    <div className="col-span-1"></div>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2 font-mono text-xs text-zinc-500 px-2">
                        #{index + 1}
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          aria-label={`Nome do mês ${index + 1}`}
                          {...register(`months.${index}.name` as const)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6E6EA] text-[#16151A] text-xs focus:outline-none focus:border-[#FF4D5A]"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={1}
                          max={500}
                          aria-label={`Dias do mês ${index + 1}`}
                          {...register(`months.${index}.days` as const)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6E6EA] text-[#16151A] text-xs font-mono focus:outline-none focus:border-[#FF4D5A]"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={`Remover mês ${index + 1}`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

          <div className="pt-4 border-t border-[#E6E6EA] flex items-center justify-end gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] shadow-sm transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white font-semibold text-xs shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all disabled:opacity-50"
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
