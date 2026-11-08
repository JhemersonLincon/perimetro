import React from "react";

export const D20Icon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Contorno externo do icosaedro */}
    <polygon points="12,2 21,7.2 21,16.8 12,22 3,16.8 3,7.2" />
    {/* Triângulo central frontal */}
    <polygon points="12,7 18.5,14.5 5.5,14.5" />
    {/* Arestas conectando os vértices externos ao triângulo central */}
    <line x1="12" y1="2" x2="12" y2="7" />
    <line x1="3" y1="7.2" x2="12" y2="7" />
    <line x1="21" y1="7.2" x2="12" y2="7" />
    <line x1="3" y1="7.2" x2="5.5" y2="14.5" />
    <line x1="21" y1="7.2" x2="18.5" y2="14.5" />
    <line x1="3" y1="16.8" x2="5.5" y2="14.5" />
    <line x1="21" y1="16.8" x2="18.5" y2="14.5" />
    <line x1="12" y1="22" x2="5.5" y2="14.5" />
    <line x1="12" y1="22" x2="18.5" y2="14.5" />
  </svg>
);

export const D6Icon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Cubo isométrico */}
    <polygon points="12,2.5 20.5,7.2 20.5,16.8 12,21.5 3.5,16.8 3.5,7.2" />
    <line x1="12" y1="2.5" x2="12" y2="12" />
    <line x1="3.5" y1="7.2" x2="12" y2="12" />
    <line x1="20.5" y1="7.2" x2="12" y2="12" />
    <line x1="12" y1="12" x2="12" y2="21.5" />
    {/* Pips / marcações sutis nos dados */}
    <circle cx="12" cy="7.2" r="1" fill="currentColor" />
    <circle cx="7.5" cy="14.5" r="0.9" fill="currentColor" />
    <circle cx="16.5" cy="14.5" r="0.9" fill="currentColor" />
  </svg>
);

export const BrandLogo: React.FC<{ className?: string; size?: "sm" | "md" | "lg" }> = ({
  className = "",
  size = "md",
}) => {
  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const d6Sizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="flex items-center -space-x-1">
        <span className="p-1.5 rounded-xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 shadow-sm flex items-center justify-center">
          <D20Icon className={iconSizes[size]} />
        </span>
        <span className="p-1 rounded-lg bg-[#FAFAFB] text-zinc-600 border border-[#E6E6EA] shadow-sm flex items-center justify-center transform translate-y-1">
          <D6Icon className={d6Sizes[size]} />
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-bold tracking-tight text-[#16151A] ${textSizes[size]}`}>
          perímetro
        </span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF4D5A]">
          rpg
        </span>
      </div>
    </div>
  );
};

