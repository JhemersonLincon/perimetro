import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { DialogModal } from "../ui/DialogModal";
import { apiRequest } from "../../services/api";
import {
  Campaign,
  CampaignMember,
  GameSession,
  GameSessionDetail,
  TimelineEvent,
  VisibilityLevel,
} from "../../types";
import { useToast } from "../../contexts/ToastContext";

interface SessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  members: CampaignMember[];
  events: TimelineEvent[];
  nextSessionNumber?: number;
  editingSession?: GameSession | GameSessionDetail | null;
}

export const SessionFormModal: React.FC<SessionFormModalProps> = ({
  isOpen,
  onClose,
  campaign,
  members,
  events,
  nextSessionNumber = 1,
  editingSession,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [sessionNumber, setSessionNumber] = useState<number>(nextSessionNumber);
  const [title, setTitle] = useState("");
  const [realDate, setRealDate] = useState("");
  const [status, setStatus] = useState<"planejada" | "realizada" | "cancelada">("planejada");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<VisibilityLevel>("public");
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingSession) {
      setSessionNumber(editingSession.session_number);
      setTitle(editingSession.title);
      setRealDate(editingSession.real_date || "");
      setStatus(
        (["planejada", "realizada", "cancelada"].includes(editingSession.status)
          ? editingSession.status
          : "planejada") as "planejada" | "realizada" | "cancelada"
      );
      setSummary(editingSession.summary);
      setNotes(editingSession.notes || "");
      setVisibility(editingSession.visibility || "public");
      setAllowedUserIds(editingSession.allowed_user_ids || []);
      const linked = events
        .filter((e) => e.session_id === editingSession.id)
        .map((e) => e.id);
      setSelectedEventIds(linked);
    } else {
      setSessionNumber(nextSessionNumber);
      setTitle("");
      setRealDate(new Date().toISOString().slice(0, 10));
      setStatus("planejada");
      setSummary("");
      setNotes("");
      setVisibility("public");
      setAllowedUserIds([]);
      setSelectedEventIds([]);
    }
    setFormError(null);
  }, [editingSession, nextSessionNumber, isOpen, events]);

  const toggleEvent = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllowedUser = (userId: string) => {
    setAllowedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error("Informe o título da sessão.");
      }
      if (!summary.trim()) {
        throw new Error("Informe a descrição ou resumo da sessão.");
      }
      const payload = {
        session_number: Number(sessionNumber),
        title: title.trim(),
        real_date: realDate || null,
        status,
        summary: summary.trim(),
        notes: notes.trim() || null,
        visibility,
        allowed_user_ids: visibility === "restricted" ? allowedUserIds : [],
        event_ids: selectedEventIds,
      };

      if (editingSession) {
        return apiRequest<GameSessionDetail>(`/sessions/${editingSession.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      return apiRequest<GameSessionDetail>(`/campaigns/${campaign.id}/sessions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["events", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-dashboard", campaign.id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.id] });
      if (editingSession) {
        queryClient.invalidateQueries({ queryKey: ["session", editingSession.id] });
      }
      showToast(
        editingSession ? "Sessão atualizada com sucesso!" : "Sessão registrada com sucesso!",
        "success"
      );
      onClose();
    },
    onError: (err: any) => {
      setFormError(err.message || "Falha ao salvar sessão.");
    },
  });

  const playerMembers = members.filter((m) => m.role === "player");

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSession ? "Editar Sessão de Jogo" : "Registrar Nova Sessão"}
      subtitle="Organize os encontros reais da mesa e associe acontecimentos da cronologia."
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
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="sess-number"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Nº da Sessão <span className="text-[#FF4D5A]">*</span>
            </label>
            <input
              id="sess-number"
              type="number"
              min={1}
              required
              value={sessionNumber}
              onChange={(e) => setSessionNumber(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm font-mono rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="sess-title"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Título da Sessão <span className="text-[#FF4D5A]">*</span>
            </label>
            <input
              id="sess-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: O Sussurro nas Catacumbas"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="sess-date"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Data Real da Sessão
            </label>
            <input
              id="sess-date"
              type="date"
              value={realDate}
              onChange={(e) => setRealDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            />
          </div>

          <div>
            <label
              htmlFor="sess-status"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Status <span className="text-[#FF4D5A]">*</span>
            </label>
            <select
              id="sess-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "planejada" | "realizada" | "cancelada")
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            >
              <option value="planejada">Planejada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="sess-visibility"
              className="block text-xs font-semibold text-zinc-700 mb-1.5"
            >
              Visibilidade <span className="text-[#FF4D5A]">*</span>
            </label>
            <select
              id="sess-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
            >
              <option value="public">Público</option>
              <option value="private">Privado (Mestre)</option>
              <option value="restricted">Restrito</option>
            </select>
          </div>
        </div>

        {visibility === "restricted" && (
          <div className="p-4 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] space-y-2">
            <div className="text-xs font-semibold text-[#16151A]">
              Jogadores Autorizados
            </div>
            {playerMembers.length === 0 ? (
              <p className="text-xs text-zinc-400">Nenhum jogador na campanha.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {playerMembers.map((pm) => {
                  const checked = allowedUserIds.includes(pm.user_id);
                  return (
                    <label
                      key={pm.user_id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                        checked
                          ? "bg-[#FF4D5A]/10 border-[#FF4D5A]/30 text-[#C42A3C] font-semibold"
                          : "bg-white border-[#E6E6EA] text-zinc-600 hover:border-zinc-300"
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

        <div>
          <label
            htmlFor="sess-summary"
            className="block text-xs font-semibold text-zinc-700 mb-1.5"
          >
            Resumo Narrativo / Descrição <span className="text-[#FF4D5A]">*</span>
          </label>
          <textarea
            id="sess-summary"
            rows={4}
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Descreva os principais desdobramentos do encontro..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
          />
        </div>

        <div>
          <label
            htmlFor="sess-notes"
            className="block text-xs font-semibold text-zinc-700 mb-1.5"
          >
            Observações Adicionais (Opcional)
          </label>
          <textarea
            id="sess-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ganchos pendentes, anotações de bastidores ou pendências para o próximo encontro..."
            className="w-full px-3.5 py-2 rounded-lg bg-[#FAFAFB] border border-[#E6E6EA] text-[#16151A] text-sm rounded-xl focus:outline-none focus:border-[#FF4D5A]"
          />
        </div>

        {/* Associação de acontecimentos */}
        <div className="pt-3 border-t border-[#E6E6EA] space-y-2">
          <div className="text-xs font-semibold text-zinc-700">
            Acontecimentos Associados a esta Sessão ({selectedEventIds.length})
          </div>
          {events.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Nenhum acontecimento cadastrado na campanha ainda.
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto p-3 rounded-2xl bg-[#FAFAFB] border border-[#E6E6EA] space-y-1.5">
              {events.map((evt) => {
                const checked = selectedEventIds.includes(evt.id);
                return (
                  <label
                    key={evt.id}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      checked
                        ? "bg-[#FF4D5A]/10 border-[#FF4D5A]/30 text-[#C42A3C] font-semibold"
                        : "bg-white border-[#E6E6EA] text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvent(evt.id)}
                      />
                      <span className="truncate font-medium">{evt.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                      {evt.date_is_unknown ? "Sem data" : evt.narrative_date}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#E6E6EA] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D5A] hover:bg-[#ff3b49] text-white font-semibold text-xs shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending
              ? "Salvando..."
              : editingSession
              ? "Salvar Alterações"
              : "Registrar Sessão"}
          </button>
        </div>
      </form>
    </DialogModal>
  );
};
