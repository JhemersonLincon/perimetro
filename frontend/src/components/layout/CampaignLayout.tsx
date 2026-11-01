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
  Calendar,
} from "lucide-react";
import { apiRequest } from "../../services/api";
import { Campaign } from "../../types";
import { Navbar } from "./Navbar";
import { LoadingState, ErrorState, RoleBadge } from "../ui/StateViews";

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
      <div className="min-h-screen bg-[#16332c] text-[#fffdf4] flex flex-col">
        <Navbar />
        <LoadingState message="Carregando dossiê da campanha..." />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="min-h-screen bg-[#16332c] text-[#fffdf4] flex flex-col">
        <Navbar />
        <div className="p-6">
          <ErrorState
            message={(error as Error)?.message || "Não foi possível acessar esta campanha."}
            onRetry={() => refetch()}
          />
          <div className="text-center mt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#d8ff72] hover:underline"
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
      label: "01 / Visão geral",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: `/campaigns/${campaign.id}/timeline`,
      label: "02 / Linha do tempo",
      icon: Clock,
      end: false,
    },
    {
      to: `/campaigns/${campaign.id}/entities`,
      label: "03 / Entidades",
      icon: Users,
      end: false,
    },
    {
      to: `/campaigns/${campaign.id}/sessions`,
      label: "04 / Sessões",
      icon: BookOpen,
      end: false,
    },
    {
      to: `/campaigns/${campaign.id}/members`,
      label: "05 / Participantes",
      icon: UserPlus,
      end: false,
    },
    ...(isGM
      ? [
          {
            to: `/campaigns/${campaign.id}/settings`,
            label: "06 / Configurações",
            icon: Settings,
            end: false,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#16332c] text-[#fffdf4] flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Barra superior compacta para dispositivos móveis */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#f6f1e4] text-[#172e28] border-b-2 border-[#172e28]">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/dashboard"
              className="p-1.5 border border-[#172e28] bg-[#fffdf4] text-[#172e28]"
              aria-label="Voltar para campanhas"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="font-display font-bold uppercase text-sm text-[#172e28] truncate">
              {campaign.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Alternar menu da campanha"
            className="p-2 border-2 border-[#172e28] bg-[#d8ff72] text-[#172e28]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu lateral Editorial / Neo-Brutalista */}
        <aside
          aria-label="Menu da campanha"
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } lg:block w-full lg:w-72 bg-[#f6f1e4] text-[#172e28] border-b-2 lg:border-b-0 lg:border-r-2 border-[#172e28] shrink-0`}
        >
          <div className="p-5 flex flex-col h-full justify-between gap-6">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#172e28] hover:underline mb-4"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#fa775d]" />
                Todas as Campanhas
              </Link>

              {/* Card Identificador da Campanha */}
              <div className="p-4 bg-[#fffdf4] border-2 border-[#172e28] shadow-[5px_5px_0_#172e28] mb-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest bg-[#172e28] text-[#d8ff72] px-2 py-0.5 truncate">
                    {campaign.rpg_system}
                  </span>
                  {campaign.status === "archived" && (
                    <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 bg-[#ffd2bb] text-[#172e28] border border-[#172e28]">
                      Arquivada
                    </span>
                  )}
                </div>
                <h2 className="font-display font-bold uppercase text-lg text-[#172e28] leading-tight tracking-[-0.04em]">
                  {campaign.name}
                </h2>
                <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-[#172e28]">
                  <RoleBadge role={campaign.user_role} />
                  <span className="font-mono text-[10px] font-bold uppercase text-[#172e28] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#fa775d]" />
                    {campaign.calendar_config?.type === "fictional" ? "Fictício" : "Gregoriano"}
                  </span>
                </div>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all ${
                          isActive
                            ? "bg-[#d8ff72] text-[#172e28] border-[#172e28] shadow-[4px_4px_0_#172e28]"
                            : "bg-[#fffdf4] text-[#172e28] border-[#172e28] hover:bg-[#ffd2bb]"
                        }`
                      }
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </span>
                      <span aria-hidden="true" className="text-[#fa775d]">
                        ✳
                      </span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="hidden lg:block p-4 bg-[#16332c] text-[#fffdf4] border-2 border-[#172e28] shadow-[5px_5px_0_#172e28] text-xs space-y-1.5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#d8ff72] border-b border-white/25 pb-1.5 mb-2 flex justify-between">
                <span>RESUMO DO ARQUIVO</span>
                <span className="text-[#fa775d]">✳</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#e2e9d8]">ACONTECIMENTOS:</span>
                <span className="font-bold text-[#d8ff72]">{campaign.events_count}</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#e2e9d8]">ENTIDADES:</span>
                <span className="font-bold text-[#d8ff72]">{campaign.entities_count}</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-[#e2e9d8]">SESSÕES:</span>
                <span className="font-bold text-[#d8ff72]">{campaign.sessions_count}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Área principal de conteúdo */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 bg-dossier-grid">
          <div className="max-w-6xl mx-auto">
            <Outlet
              context={
                {
                  campaign,
                  isGM,
                  refetchCampaign: refetch,
                } satisfies CampaignOutletContext
              }
            />
          </div>
        </main>
      </div>
    </div>
  );
};
