import React, { useEffect, useId, useRef, useState } from "react";
import { Image as ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";
import { resolveMediaUrl } from "../../services/api";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const ALLOWED_EXTENSION_REGEX = /\.(jpe?g|png|webp)$/i;
export const MAX_COVER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface CoverImageUploadProps {
  id?: string;
  label?: string;
  file: File | null;
  existingCoverUrl?: string | null;
  error?: string | null;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onError: (message: string | null) => void;
  onRemoveExisting?: () => void;
}

export const CoverImageUpload: React.FC<CoverImageUploadProps> = ({
  id,
  label = "Imagem de Capa (Opcional)",
  file,
  existingCoverUrl,
  error,
  disabled = false,
  onFileChange,
  onError,
  onRemoveExisting,
}) => {
  const generatedId = useId();
  const inputId = id || `cover-upload-${generatedId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [objectPreviewUrl, setObjectPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const previewUrl = objectPreviewUrl || resolveMediaUrl(existingCoverUrl);

  const processCandidateFile = (candidate: File | null) => {
    if (!candidate) return;

    const mime = candidate.type.toLowerCase();
    const isValidType = mime
      ? ALLOWED_MIME_TYPES.has(mime)
      : ALLOWED_EXTENSION_REGEX.test(candidate.name);

    if (!isValidType) {
      onFileChange(null);
      onError("Formato não suportado. Selecione uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (candidate.size === 0) {
      onFileChange(null);
      onError("O arquivo selecionado está vazio.");
      return;
    }

    if (candidate.size > MAX_COVER_IMAGE_SIZE_BYTES) {
      onFileChange(null);
      onError("A imagem ultrapassa o limite máximo de 5 MB.");
      return;
    }

    onError(null);
    onFileChange(candidate);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      processCandidateFile(selected);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0] || null;
    if (dropped) {
      processCandidateFile(dropped);
    }
  };

  const handleClearImage = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onError(null);
    onFileChange(null);
    if (onRemoveExisting) {
      onRemoveExisting();
    }
  };

  const describedBy = error ? `${hintId} ${errorId}` : hintId;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold text-zinc-700"
      >
        {label}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        name="cover_image"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={handleInputChange}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
        className="sr-only peer"
      />

      {previewUrl ? (
        <div className="rounded-2xl border border-[#E6E6EA] bg-[#FAFAFB] p-3.5 space-y-3">
          <div className="relative h-44 w-full overflow-hidden rounded-xl border border-[#E6E6EA] bg-white">
            <img
              src={previewUrl}
              alt={
                file
                  ? `Pré-visualização da capa selecionada (${file.name})`
                  : "Pré-visualização da capa atual da campanha"
              }
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#FF4D5A]/10 border border-[#FF4D5A]/20 text-[#C42A3C] flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#16151A] truncate">
                  {file ? file.name : "Capa atual da campanha"}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {file ? `${formatFileSize(file.size)} • Pronta para envio` : "Arquivo salvo no servidor"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor={inputId}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors cursor-pointer [.peer:focus-visible~div_&]:outline [.peer:focus-visible~div_&]:outline-2 [.peer:focus-visible~div_&]:outline-offset-2 [.peer:focus-visible~div_&]:outline-[#FF4D5A] ${
                  disabled ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#FF4D5A]" />
                Trocar imagem
              </label>

              <button
                type="button"
                onClick={handleClearImage}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-[#E6E6EA] text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#FF4D5A] ${
            isDragging
              ? "border-[#FF4D5A] bg-[#FF4D5A]/5"
              : error
              ? "border-rose-300 bg-rose-50/40 hover:border-rose-400"
              : "border-[#E6E6EA] bg-[#FAFAFB] hover:border-[#FF4D5A]/50 hover:bg-white"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FF4D5A]/10 border border-[#FF4D5A]/20 text-[#FF4D5A] flex items-center justify-center mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-[#16151A]">
            Clique para escolher ou arraste uma imagem de capa
          </span>
          <span id={hintId} className="text-xs text-zinc-500 mt-1">
            Formatos aceitos: JPG, PNG ou WebP (máx. 5 MB)
          </span>
        </label>
      )}

      {previewUrl && (
        <p id={hintId} className="text-[11px] text-zinc-500">
          Formatos aceitos: JPG, PNG ou WebP (máx. 5 MB).
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-rose-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
