import React from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Users,
  MapPin,
  Building2,
  BookOpen,
  UserCheck,
  Settings,
  Plus,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { CampaignOutletContext } from "../../components/layout/CampaignLayout";
import { apiRequest } from "../../services/api";
import { CampaignDashboard } from "../../types";
import {
  LoadingState,
  ErrorState,
  RoleBadge,
  VisibilityBadge,
} from "../../components/ui/StateViews";
import {
  EVENT_CATEGORY_META,
  SESSION_STATUS_LABELS,
  formatRealDate,
} from "../../utils/formatters";

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
    return <LoadingState message="Calculando indicadores da campanha..." />;
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
    <div className="space-y-8">
      {/* Cabeçalho da Campanha */}
      <section className="rounded-2xl bg-obsidian-900 border border-zinc-800 overflow-hidden shadow-xl">
        {campaign.cover_url && (
          <div className="h-44 w-full relative overflow-hidden border-b border-zinc-800">
            <img
              src={campaign.cover_url}
              alt={`Imagem de capa da campanha ${campaign.name}`}
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/40 to-transparent" />
          </div>
        )}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {campaign.rpg_system}
              </span>
              <RoleBadge role={campaign.user_role} />
              {campaign.start_date && (
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Início: {formatRealDate(campaign.start_date)}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-100">
              {campaign.name}
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line">
              {campaign.description || "Nenhuma descrição registrada para esta campanha."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to={`/campaigns/${campaign.id}/timeline`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-display font-semibold text-sm transition-colors"
            >
              <Clock className="w-4 h-4" />
              Abrir Linha do Tempo
            </Link>
            {isGM && (
              <Link
                to={`/campaigns/${campaign.id}/settings`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-obsidian-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-sm font-medium transition-colors"
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                Configurações
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Indicadores Calculados em Tempo Real */}
      <section aria-label="Indicadores da campanha">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            to={`/campaigns/${campaign.id}/timeline`}
            className="p-4 rounded-xl bg-obsidian-900 border border-zinc-800 hover:border-amber-500/40 transition-colors"
          >
            <Clock className="w-5 h-5 text-amber-400 mb-2" />
            <div className="font-mono text-2xl font-bold text-zinc-100">
              {indicators.events_count}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Acontecimentos</div>
          </Link>

          <Link
            to={`/campaigns/${campaign.id}/entities?category=character`}
            className="p-4 rounded-xl bg-obsidian-900 border border-zinc-800 hover:border-amber-500/40 transition-colors"
          >
            <Users className="w-5 h-5 text-sky-400 mb-2" />
            <div className="font-mono text-2xl font-bold text-zinc-100">
              {indicators.characters_and_npcs_count}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Personagens &amp; NPCs ({indicators.characters_count} PJ / {indicators.npcs_count} NPC)
            </div>
          </Link>

          <Link
            to={`/campaigns/${campaign.id}/entities?category=location`}
            className="p-4 rounded-xl bg-obsidian-900 border border-zinc-800 hover:border-amber-500/40 transition-colors"
          >
            <MapPin className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="font-mono text-2xl font-bold text-zinc-100">
              {indicators.locations_count}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Localidades</div>
          </Link>

          <Link
            to={`/campaigns/${campaign.id}/entities?category=organization`}
            className="p-4 rounded-xl bg-obsidian-900 border border-zinc-800 hover:border-amber-500/40 transition-colors"
          >
            <Building2 className="w-5 h-5 text-purple-400 mb-2" />
            <div className="font-mono text-2xl font-bold text-zinc-100">
              {indicators.organizations_count}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Organizações</div>
          </Link>

          <Link
            to={`/campaigns/${campaign.id}/sessions`}
            className="p-4 rounded-xl bg-obsidian-900 border border-zinc-800 hover:border-amber-500/40 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-orange-400 mb-2" />
            <div className="font-mono text-2xl font-bold text-zinc-100">
              {indicators.sessions_count}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Sessões Registradas</div>
          </Link>

          <Link
            to={`/campaigns/${campaign.id}/members`}
            className="p-4 rounded-xl bg-obsidian-900 border border-zinc-800 hover:border-amber-500/40 transition-colors"
          >
            <UserCheck className="w-5 h-5 text-rose-400 mb-2" />
            <div className="font-mono text-2xl font-bold text-zinc-100">
              {indicators.members_count}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Participantes</div>
          </Link>
        </div>
      </section>

      {/* Acesso Rápido */}
      <section className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold text-zinc-100">
            Acesso Rápido
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            {isGM ? "Operações do Mestre" : "Navegação de Consulta"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {isGM ? (
            <>
              <button
                type="button"
                onClick={() => navigate(`/campaigns/${campaign.id}/timeline?newEvent=1`)}
                className="p-3.5 rounded-xl bg-obsidian-950 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <Plus className="w-4 h-4 text-amber-400 mb-1.5" />
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300">
                  Criar Acontecimento
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/campaigns/${campaign.id}/entities?newEntity=character`)
                }
                className="p-3.5 rounded-xl bg-obsidian-950 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <Plus className="w-4 h-4 text-sky-400 mb-1.5" />
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300">
                  Cadastrar Personagem
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/campaigns/${campaign.id}/entities?newEntity=location`)}
                className="p-3.5 rounded-xl bg-obsidian-950 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <Plus className="w-4 h-4 text-emerald-400 mb-1.5" />
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300">
                  Cadastrar Localidade
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/campaigns/${campaign.id}/entities?newEntity=organization`)
                }
                className="p-3.5 rounded-xl bg-obsidian-950 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <Plus className="w-4 h-4 text-purple-400 mb-1.5" />
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300">
                  Cadastrar Organização
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/campaigns/${campaign.id}/sessions?newSession=1`)}
                className="p-3.5 rounded-xl bg-obsidian-950 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <Plus className="w-4 h-4 text-orange-400 mb-1.5" />
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300">
                  Registrar Sessão
                </div>
              </button>
            </>
          ) : null}

          <Link
            to={`/campaigns/${campaign.id}/timeline`}
            className="p-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all"
          >
            <Clock className="w-4 h-4 text-amber-400 mb-1.5" />
            <div className="text-xs font-semibold text-amber-200">
              Visualizar Linha do Tempo
            </div>
          </Link>
        </div>
      </section>

      {/* Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Acontecimentos */}
        <section className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <h2 className="font-display text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Últimos Acontecimentos
              </h2>
              <Link
                to={`/campaigns/${campaign.id}/timeline`}
                className="text-xs font-mono text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recent_events.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">
                Nenhum acontecimento registrado até o momento.
              </p>
            ) : (
              <div className="space-y-3">
                {recent_events.map((evt) => {
                  const catMeta =
                    EVENT_CATEGORY_META[evt.category] || EVENT_CATEGORY_META.outro;
                  return (
                    <Link
                      key={evt.id}
                      to={`/campaigns/${campaign.id}/events/${evt.id}`}
                      className="block p-3.5 rounded-xl bg-obsidian-950/80 hover:bg-obsidian-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs text-amber-400">
                          {evt.date_is_unknown
                            ? "Data Indefinida"
                            : evt.narrative_date || "Sem data"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${catMeta.badgeClass}`}
                          >
                            {catMeta.label}
                          </span>
                          <VisibilityBadge visibility={evt.visibility} />
                        </div>
                      </div>
                      <h3 className="font-display font-semibold text-sm text-zinc-100">
                        {evt.title}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Últimas Sessões */}
        <section className="rounded-2xl bg-obsidian-900 border border-zinc-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <h2 className="font-display text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Últimas Sessões Registradas
              </h2>
              <Link
                to={`/campaigns/${campaign.id}/sessions`}
                className="text-xs font-mono text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recent_sessions.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">
                Nenhuma sessão registrada até o momento.
              </p>
            ) : (
              <div className="space-y-3">
                {recent_sessions.map((sess) => {
                  const st =
                    SESSION_STATUS_LABELS[sess.status] || SESSION_STATUS_LABELS.planejada;
                  return (
                    <Link
                      key={sess.id}
                      to={`/campaigns/${campaign.id}/sessions/${sess.id}`}
                      className="block p-3.5 rounded-xl bg-obsidian-950/80 hover:bg-obsidian-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs text-amber-400 font-semibold">
                          SESSÃO #{String(sess.session_number).padStart(2, "0")} •{" "}
                          {formatRealDate(sess.real_date)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${st.className}`}
                          >
                            {st.label}
                          </span>
                          <VisibilityBadge visibility={sess.visibility} />
                        </div>
                      </div>
                      <h3 className="font-display font-semibold text-sm text-zinc-100">
                        {sess.title}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
