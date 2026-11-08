import React from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  BookOpen,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import { CampaignDashboard } from "../../types";
import { LoadingState, ErrorState, RpgSystemBadge } from "../../components/ui/StateViews";
import { EVENT_CATEGORY_META, formatRealDate } from "../../utils/formatters";

export const CampaignDashboardPage: React.FC = () => {
  const { campaign, isGM } = useOutletContext<CampaignOutletContext>();
  const navigate = useNavigate();

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["campaign-dashboard", campaign.id],
    queryFn: () => apiRequest<CampaignDashboard>(`/campaigns/${campaign.id}/dashboard`),
  });

  if (isLoading) {
    return <LoadingState message="Carregando painel da campanha..." />;
  }

  if (isError || !dashboard) {
    return (
      <ErrorState
        message={(error as Error)?.message || "Erro ao carregar o painel da campanha."}
        onRetry={() => refetch()}
      />
    );
  }

  const { indicators, recent_events, recent_sessions } = dashboard;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Topo da Campanha - Design Moderno Fundo Branco (Conforme Referência) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3">
            {/* Badges do Sistema e Papel */}
            <div className="flex flex-wrap items-center gap-2">
              <RpgSystemBadge system={campaign.rpg_system} />
              <span className="px-3.5 py-1 text-xs font-medium rounded-full bg-white text-zinc-600 border border-[#E6E6EA]">
                {isGM ? "Mestre" : "Jogador"}
              </span>
            </div>

            {/* Título da Campanha */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#16151A]">
              {campaign.name}
            </h1>

            {/* Subtítulo / Descrição */}
            <p className="text-sm text-zinc-500 font-normal max-w-3xl leading-relaxed">
              {campaign.description || "Ainda em construção"}
            </p>
          </div>

          {/* Botão de Ação Primária: Abrir Linha do Tempo */}
          <Link
            to={`/campaigns/${campaign.id}/timeline`}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-2xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white font-medium text-sm shadow-[0_4px_14px_rgba(255,77,90,0.35)] transition-all shrink-0"
          >
            Abrir linha do tempo
          </Link>
        </div>

        {/* 4 Cards de Métricas e Indicadores em Linha */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card Acontecimentos (Número em Vermelho #FF4D5A) */}
          <Link
            to={`/campaigns/${campaign.id}/timeline`}
            className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-5 hover:border-zinc-300 transition-all block group"
          >
            <div className="text-3xl sm:text-4xl font-bold text-[#FF4D5A] group-hover:opacity-90">
              {indicators.events_count}
            </div>
            <div className="text-xs text-zinc-500 font-normal mt-1">Acontecimentos</div>
          </Link>

          {/* Card Personagens */}
          <Link
            to={`/campaigns/${campaign.id}/entities?category=character`}
            className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-5 hover:border-zinc-300 transition-all block group"
          >
            <div className="text-3xl sm:text-4xl font-bold text-[#16151A] group-hover:text-[#FF4D5A] transition-colors">
              {indicators.characters_and_npcs_count}
            </div>
            <div className="text-xs text-zinc-500 font-normal mt-1">Personagens</div>
          </Link>

          {/* Card Localidades */}
          <Link
            to={`/campaigns/${campaign.id}/entities?category=location`}
            className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-5 hover:border-zinc-300 transition-all block group"
          >
            <div className="text-3xl sm:text-4xl font-bold text-[#16151A] group-hover:text-[#FF4D5A] transition-colors">
              {indicators.locations_count}
            </div>
            <div className="text-xs text-zinc-500 font-normal mt-1">Localidades</div>
          </Link>

          {/* Card Participantes */}
          <Link
            to={`/campaigns/${campaign.id}/members`}
            className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-5 hover:border-zinc-300 transition-all block group"
          >
            <div className="text-3xl sm:text-4xl font-bold text-[#16151A] group-hover:text-[#FF4D5A] transition-colors">
              {indicators.members_count}
            </div>
            <div className="text-xs text-zinc-500 font-normal mt-1">Participantes</div>
          </Link>
        </div>

        {/* 3 Botões de Ação Rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => navigate(`/campaigns/${campaign.id}/timeline?newEvent=1`)}
            className="bg-white border border-[#E6E6EA] rounded-2xl py-3.5 px-5 text-sm font-medium text-[#16151A] hover:border-[#FF4D5A]/40 hover:bg-[#FAFAFB] hover:text-[#C42A3C] transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#FF4D5A]" />
            Criar acontecimento
          </button>

          <button
            type="button"
            onClick={() => navigate(`/campaigns/${campaign.id}/entities?newEntity=character`)}
            className="bg-white border border-[#E6E6EA] rounded-2xl py-3.5 px-5 text-sm font-medium text-[#16151A] hover:border-[#FF4D5A]/40 hover:bg-[#FAFAFB] hover:text-[#C42A3C] transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#FF4D5A]" />
            Cadastrar personagem
          </button>

          <button
            type="button"
            onClick={() => navigate(`/campaigns/${campaign.id}/sessions?newSession=1`)}
            className="bg-white border border-[#E6E6EA] rounded-2xl py-3.5 px-5 text-sm font-medium text-[#16151A] hover:border-[#FF4D5A]/40 hover:bg-[#FAFAFB] hover:text-[#C42A3C] transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#FF4D5A]" />
            Registrar sessão
          </button>
        </div>
      </section>

      {/* Seção de Conteúdo Recente: Acontecimentos e Sessões */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E6E6EA]">
        {/* Acontecimentos Recentes */}
        <div className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF4D5A]" />
              <h2 className="text-base font-semibold text-[#16151A]">
                Acontecimentos Recentes
              </h2>
            </div>
            <Link
              to={`/campaigns/${campaign.id}/timeline`}
              className="text-xs font-medium text-[#C42A3C] hover:text-[#FF4D5A] inline-flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent_events.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Nenhum acontecimento registrado ainda. Use a ação rápida acima para criar o primeiro.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent_events.slice(0, 5).map((evt) => {
                const catMeta = EVENT_CATEGORY_META[evt.category] || EVENT_CATEGORY_META.outro;
                return (
                  <Link
                    key={evt.id}
                    to={`/campaigns/${campaign.id}/events/${evt.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E6E6EA] hover:border-zinc-300 transition-all block group"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-sm font-medium text-[#16151A] group-hover:text-[#C42A3C] truncate">
                        {evt.title}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {evt.narrative_date || "Data a definir"}
                      </div>
                    </div>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#FAFAFB] border border-[#E6E6EA] text-zinc-600 shrink-0">
                      {catMeta.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Sessões Recentes */}
        <div className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FF4D5A]" />
              <h2 className="text-base font-semibold text-[#16151A]">
                Sessões de Jogo
              </h2>
            </div>
            <Link
              to={`/campaigns/${campaign.id}/sessions`}
              className="text-xs font-medium text-[#C42A3C] hover:text-[#FF4D5A] inline-flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent_sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Nenhuma sessão registrada. Clique em registrar sessão para começar o diário de jogo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent_sessions.slice(0, 5).map((sess) => (
                <Link
                  key={sess.id}
                  to={`/campaigns/${campaign.id}/sessions/${sess.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E6E6EA] hover:border-zinc-300 transition-all block group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-sm font-medium text-[#16151A] group-hover:text-[#C42A3C] truncate">
                      Sessão #{String(sess.session_number).padStart(2, "0")} — {sess.title}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {sess.real_date ? formatRealDate(sess.real_date) : "Data a definir"}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#FAFAFB] border border-[#E6E6EA] text-zinc-600 shrink-0 capitalize">
                    {sess.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
