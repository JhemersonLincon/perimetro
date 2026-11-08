import React, { useState } from "react";
import { NavLink, Outlet, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Clock,
  Users,
  BookOpen,
  UserPlus,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { apiRequest } from "../../services/api";
import { Campaign } from "../../types";
import { Navbar } from "./Navbar";
import { LoadingState, ErrorState } from "../ui/StateViews";
import { BrandLogo } from "../ui/DiceIcons";

export interface CampaignOutletContext {
  campaign: Campaign;
  isGM: boolean;
  refetchCampaign: () => void;
}

export const CampaignLayout: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    data: campaign,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => apiRequest<Campaign>(`/campaigns/${campaignId}`),
    enabled: !!campaignId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFB] text-[#16151A] flex flex-col">
        <Navbar />
        <LoadingState message="Carregando dados da campanha..." />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="min-h-screen bg-[#FAFAFB] text-[#16151A] flex flex-col">
        <Navbar />
        <div className="p-6 max-w-lg mx-auto">
          <ErrorState
            message={(error as Error)?.message || "Não foi possível acessar esta campanha."}
            onRetry={() => refetch()}
          />
          <div className="text-center mt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#16151A] hover:text-[#FF4D5A]"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar para Minhas Campanhas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isGM = campaign.user_role === "gm";

  const navItems = [
    {
      to: `/campaigns/${campaign.id}`,
      label: "Visão geral",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: `/campaigns/${campaign.id}/timeline`,
      label: "Linha do tempo",
      icon: Clock,
      end: false,
    },
    {
      to: `/campaigns/${campaign.id}/entities`,
      label: "Entidades",
      icon: Users,
      end: false,
    },
    {
      to: `/campaigns/${campaign.id}/sessions`,
      label: "Sessões",
      icon: BookOpen,
      end: false,
    },
    {
      to: `/campaigns/${campaign.id}/members`,
      label: "Participantes",
      icon: UserPlus,
      end: false,
    },
    ...(isGM
      ? [
          {
            to: `/campaigns/${campaign.id}/settings`,
            label: "Configurações",
            icon: Settings,
            end: false,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#16151A] flex flex-col antialiased">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Barra superior compacta para dispositivos móveis */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E6E6EA]">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/dashboard"
              className="p-1.5 rounded-lg border border-[#E6E6EA] bg-[#FAFAFB] text-[#16151A]"
              aria-label="Voltar para campanhas"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="font-bold text-sm text-[#16151A] truncate">
              {campaign.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Alternar menu da campanha"
            className="p-2 rounded-lg border border-[#E6E6EA] bg-[#FAFAFB] text-[#16151A]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu lateral Moderno com Fundo Branco (Design da Referência) */}
        <aside
          aria-label="Menu da campanha"
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } lg:block w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#E6E6EA] shrink-0`}
        >
          <div className="p-5 flex flex-col h-full justify-between gap-6">
            <div>
              {/* Logo Perímetro */}
              <div className="mb-6 px-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center hover:opacity-90 transition-opacity"
                  aria-label="Perímetro — Ir ao Dashboard"
                >
                  <BrandLogo size="md" />
                </Link>
              </div>

              {/* Links de Navegação com Pills Suaves */}
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2.5 rounded-2xl text-sm transition-all ${
                        isActive
                          ? "bg-[#FF4D5A]/10 text-[#C42A3C] font-semibold"
                          : "text-zinc-600 hover:text-[#16151A] hover:bg-[#FAFAFB] font-medium"
                      }`
                    }
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Rodapé da sidebar com link de retorno */}
            <div className="pt-4 border-t border-[#E6E6EA]">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-[#16151A] rounded-xl hover:bg-[#FAFAFB] transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-400" />
                <span>Voltar ao painel geral</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal com Fundo Branco Limpo */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full bg-white">
          <Outlet context={{ campaign, isGM, refetchCampaign: refetch } satisfies CampaignOutletContext} />
        </main>
      </div>
    </div>
  );
};
