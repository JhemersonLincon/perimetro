import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { DialogModal } from "../ui/DialogModal";
import { apiRequest } from "../../services/api";
import {
  Campaign,
  CampaignMember,
  Entity,
  EntityCategory,
  VisibilityLevel,
} from "../../types";
import {
  ENTITY_CATEGORY_LABELS,
  ENTITY_STATUS_OPTIONS,
} from "../../utils/formatters";
import { useToast } from "../../contexts/ToastContext";

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  members: CampaignMember[];
  initialCategory?: EntityCategory;
  editingEntity?: Entity | null;
}

export const EntityFormModal: React.FC<EntityFormModalProps> = ({
  isOpen,
  onClose,
  campaign,
  members,
  initialCategory = "character",
  editingEntity,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<EntityCategory>(initialCategory);
  const [status, setStatus] = useState<string>("ativo");
  const [description, setDescription] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [visibility, setVisibility] = useState<VisibilityLevel>("public");
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingEntity) {
      setName(editingEntity.name);
      setCategory(editingEntity.category);
      setStatus(editingEntity.status);
      setDescription(editingEntity.description);
      setExtraInfo(editingEntity.extra_info || "");
      setImageUrl(editingEntity.image_url || "");
      setVisibility(editingEntity.visibility);
      setAllowedUserIds(editingEntity.allowed_user_ids || []);
    } else {
      const defaultStatus = ENTITY_STATUS_OPTIONS[initialCategory][0].value;
      setName("");
      setCategory(initialCategory);
      setStatus(defaultStatus);
      setDescription("");
      setExtraInfo("");
      setImageUrl("");
      setVisibility("public");
      setAllowedUserIds([]);
    }
    setFormError(null);
  }, [editingEntity, initialCategory, isOpen]);

  const handleCategoryChange = (newCat: EntityCategory) => {
    setCategory(newCat);
    const validStatuses = ENTITY_STATUS_OPTIONS[newCat].map((o) => o.value);
    if (!validStatuses.includes(status)) {
      setStatus(ENTITY_STATUS_OPTIONS[newCat][0].value);
    }
  };

  const toggleAllowedUser = (userId: string) => {
    setAllowedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error("Informe o nome da entidade.");
      }
      if (!description.trim()) {
        throw new Error("Informe a descrição da entidade.");
      }
      const payload = {
        name: name.trim(),
        category,
        status,
        description: description.trim(),
        extra_info: extraInfo.trim() || null,
        image_url: imageUrl.trim() || null,
        visibility,
        allowed_user_ids: visibility === "restricted" ? allowedUserIds : [],
      };

      if (editingEntity) {
        return apiRequest<Entity>(`/entities/${editingEntity.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return apiRequest<Entity>(`/campaigns/${campaign.id}/entities`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      if (editingEntity) {
        queryClient.invalidateQueries({ queryKey: ["entity", editingEntity.id] });
      }
      showToast(
        editingEntity ? "Entidade atualizada com sucesso!" : "Entidade cadastrada com sucesso!",
        "success"
      );
      onClose();
    },
    onError: (err: any) => {
      setFormError(err.message || "Falha ao salvar entidade.");
    },
  });

  const playerMembers = members.filter((m) => m.role === "player");

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEntity ? "Editar Entidade" : "Cadastrar Nova Entidade"}
      subtitle="Registre personagens, NPCs, localidades ou organizações presentes na narrativa."
      maxWidthClass="max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        {formError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200"
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="ent-name"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Nome da Entidade <span className="text-amber-400">*</span>
            </label>
            <input
              id="ent-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Inspetor Arthur Vance / Catedral de Valen / Ordem Cinzenta"
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="ent-category"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Categoria <span className="text-amber-400">*</span>
            </label>
            <select
              id="ent-category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as EntityCategory)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            >
              {(Object.keys(ENTITY_CATEGORY_LABELS) as EntityCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {ENTITY_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ent-status"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Status <span className="text-amber-400">*</span>
            </label>
            <select
              id="ent-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            >
              {ENTITY_STATUS_OPTIONS[category].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="ent-description"
            className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
          >
            Descrição Narrativa <span className="text-amber-400">*</span>
          </label>
          <textarea
            id="ent-description"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a história, aparência, motivações ou características principais..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 leading-relaxed"
          />
        </div>

        <div>
          <label
            htmlFor="ent-extra"
            className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
          >
            Informações Complementares (Opcional)
          </label>
          <textarea
            id="ent-extra"
            rows={2}
            value={extraInfo}
            onChange={(e) => setExtraInfo(e.target.value)}
            placeholder="Títulos, conexões conhecidas, rumores, notas rápidas..."
            className="w-full px-3.5 py-2 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ent-image"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              URL da Imagem / Retrato (Opcional)
            </label>
            <input
              id="ent-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/retrato.jpg"
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="ent-visibility"
              className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5"
            >
              Visibilidade <span className="text-amber-400">*</span>
            </label>
            <select
              id="ent-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-950 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="public">Público (Todos os participantes)</option>
              <option value="private">Privado (Somente o Mestre)</option>
              <option value="restricted">Restrito (Jogadores selecionados)</option>
            </select>
          </div>
        </div>

        {visibility === "restricted" && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-300">
              Jogadores Autorizados
            </div>
            {playerMembers.length === 0 ? (
              <p className="text-xs text-zinc-400">
                Nenhum jogador cadastrado na campanha até o momento.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {playerMembers.map((pm) => {
                  const checked = allowedUserIds.includes(pm.user_id);
                  return (
                    <label
                      key={pm.user_id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                        checked
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                          : "bg-obsidian-950 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAllowedUser(pm.user_id)}
                      />
                      <span>
                        {pm.user.name} (@{pm.user.username})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending
              ? "Salvando..."
              : editingEntity
              ? "Salvar Alterações"
              : "Cadastrar Entidade"}
          </button>
        </div>
      </form>
    </DialogModal>
  );
};
