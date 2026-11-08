import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Clock,
  Eye,
  FolderKanban,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { BrandLogo, D20Icon, D6Icon } from "../../components/ui/DiceIcons";
import { Navbar } from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import rpgTabletopHero from "../../assets/rpg-tabletop-hero.jpg";

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#16151A] flex flex-col antialiased">
      <Navbar />

      <main id="conteudo" className="flex-1">
        {/* HERO SECTION — Design Moderno Fundo Branco com Acento Coral */}
        <section
          className="bg-gradient-to-b from-white via-white to-[#FAFAFB] border-b border-[#E6E6EA] py-14 sm:py-20 lg:py-24 overflow-x-clip"
          aria-labelledby="hero-title"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
              {/* Coluna Esquerda: Copy e CTAs */}
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 text-xs font-semibold">
                  <D20Icon className="w-3.5 h-3.5 text-[#FF4D5A]" />
                  <span>Plataforma de gerenciamento narrativo de RPG</span>
                </div>

                <h1
                  id="hero-title"
                  className="text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] font-bold tracking-tight text-[#16151A] mt-5 mb-5"
                >
                  Histórias que <span className="text-[#FF4D5A]">saem</span> do papel.
                </h1>

                <p className="text-base sm:text-lg leading-relaxed max-w-xl text-zinc-600">
                  Um ambiente centralizado para transformar anotações dispersas em uma linha do
                  tempo interativa. Conecte acontecimentos, personagens, NPCs, localidades,
                  organizações e sessões de jogo.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 mt-8">
                  {isAuthenticated ? (
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(255,77,90,0.35)] hover:shadow-[0_6px_20px_rgba(255,77,90,0.45)] transition-all"
                    >
                      <span>Acessar Campanhas</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(255,77,90,0.35)] hover:shadow-[0_6px_20px_rgba(255,77,90,0.45)] transition-all"
                      >
                        <span>Criar Conta Gratuita</span>
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-[#FAFAFB] text-[#16151A] border border-[#E6E6EA] hover:border-zinc-300 text-sm font-semibold shadow-sm transition-all"
                      >
                        Já possuo conta
                      </Link>
                    </>
                  )}

                  <a
                    href="#proposito"
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-600 hover:text-[#16151A] hover:bg-white transition-all"
                  >
                    <span>Conheça a plataforma</span>
                    <ArrowDown className="w-4 h-4 text-[#FF4D5A]" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Coluna Direita: Ilustração de Mesa de RPG com Tags Flutuantes Modernas */}
              <div className="relative lg:pl-4">
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 bg-gradient-to-tr from-[#FF4D5A]/12 via-[#FF4D5A]/5 to-transparent rounded-[2rem] blur-2xl pointer-events-none"
                />

                <div className="relative rounded-3xl bg-white border border-[#E6E6EA] p-2.5 sm:p-3.5 shadow-[0_20px_50px_rgba(22,21,26,0.08)]">
                  <div className="rounded-2xl overflow-hidden bg-[#FAFAFB] border border-[#E6E6EA]/70">
                    <img
                      src={rpgTabletopHero}
                      alt="Ilustração de uma mesa de RPG com mestre atrás do escudo, jogadores com fichas, mapa hexagonal, cartões de linha do tempo e dados poliédricos d20 e d6"
                      width={1200}
                      height={896}
                      {...({ fetchpriority: "high" } as React.ImgHTMLAttributes<HTMLImageElement>)}
                      className="w-full h-auto block object-cover"
                    />
                  </div>

                  {/* Tag Flutuante 1: Linha do Tempo */}
                  <div className="absolute top-3 right-3 sm:-top-4 sm:-right-4 bg-white/95 backdrop-blur-md border border-[#E6E6EA] rounded-2xl px-3.5 py-2.5 shadow-[0_10px_28px_rgba(22,21,26,0.10)] flex items-center gap-2.5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5">
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 flex items-center justify-center shrink-0"
                    >
                      <Clock className="w-4 h-4" />
                    </span>
                    <div className="leading-tight">
                      <span className="block text-xs font-bold text-[#16151A]">Linha do Tempo</span>
                      <span className="block text-[11px] text-zinc-500">Anos, meses &amp; dias</span>
                    </div>
                  </div>

                  {/* Tag Flutuante 2: Mestres & Jogadores */}
                  <div className="absolute bottom-3 left-3 sm:-bottom-4 sm:-left-4 bg-white/95 backdrop-blur-md border border-[#E6E6EA] rounded-2xl px-3.5 py-2.5 shadow-[0_10px_28px_rgba(22,21,26,0.10)] flex items-center gap-2.5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5">
                    <div className="flex items-center -space-x-1 shrink-0" aria-hidden="true">
                      <span className="w-7 h-7 rounded-xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 flex items-center justify-center">
                        <D20Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-[#FAFAFB] text-zinc-700 border border-[#E6E6EA] flex items-center justify-center translate-y-0.5">
                        <D6Icon className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="leading-tight">
                      <span className="block text-xs font-bold text-[#16151A]">
                        Mestres &amp; Jogadores
                      </span>
                      <span className="block text-[11px] text-zinc-500">Colaboração na mesa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Destaques da Hero */}
            <div className="border-t border-[#E6E6EA] pt-7 mt-14 flex flex-wrap items-center justify-between gap-4">
              <ul className="flex flex-wrap items-center gap-3">
                <li className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E6E6EA] px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm">
                  <FolderKanban className="w-3.5 h-3.5 text-[#FF4D5A]" aria-hidden="true" />
                  Múltiplas Campanhas
                </li>
                <li className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E6E6EA] px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-[#FF4D5A]" aria-hidden="true" />
                  Calendário Narrativo Flexível
                </li>
                <li className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E6E6EA] px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D5A]" aria-hidden="true" />
                  Visibilidade em 3 Níveis
                </li>
              </ul>

              <a
                href="#proposito"
                className="text-xs font-semibold text-[#C42A3C] hover:text-[#FF4D5A] inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Role para explorar</span>
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* FAIXA DE RECURSOS SUAVE */}
        <div className="bg-white border-b border-[#E6E6EA] py-3.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <D20Icon className="w-3.5 h-3.5 text-[#FF4D5A]" />
              Acontecimentos
            </span>
            <span className="text-zinc-300" aria-hidden="true">
              •
            </span>
            <span>Personagens &amp; NPCs</span>
            <span className="text-zinc-300" aria-hidden="true">
              •
            </span>
            <span>Localidades &amp; Organizações</span>
            <span className="text-zinc-300" aria-hidden="true">
              •
            </span>
            <span>Sessões de Jogo</span>
            <span className="text-zinc-300" aria-hidden="true">
              •
            </span>
            <span className="inline-flex items-center gap-2">
              <D6Icon className="w-3.5 h-3.5 text-[#16151A]" />
              Zoom Semântico
            </span>
          </div>
        </div>

        {/* 01 / O PROPÓSITO */}
        <section id="proposito" className="bg-[#FAFAFB] py-20 sm:py-24" aria-labelledby="proposito-title">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[28%_72%] gap-8 items-start">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4D5A]" aria-hidden="true" />
                01 · O Propósito
              </span>
            </div>

            <div className="space-y-8">
              <h2
                id="proposito-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-[#16151A]"
              >
                Histórias reais.{" "}
                <span className="text-[#FF4D5A]">Mundos em movimento.</span>
              </h2>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <p className="text-base sm:text-lg leading-relaxed max-w-xl text-zinc-600">
                  Informações narrativas que normalmente ficam dispersas em anotações, planilhas e
                  documentos ganham uma estrutura organizada, visualmente acessível e
                  interconectada ao redor de uma linha do tempo viva e colaborativa.
                </p>

                <div className="bg-white border border-[#E6E6EA] rounded-2xl p-6 shadow-sm shrink-0 w-full md:w-72">
                  <BrandLogo size="sm" />
                  <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                    Eixo temporal compartilhado onde fatos canônicos do Mestre convivem com notas
                    e diários dos jogadores.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E6E6EA] flex items-center justify-between text-[11px] font-medium text-zinc-500">
                    <span>Arquivo vivo</span>
                    <span className="text-[#C42A3C] font-semibold">Granularidade flexível</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 / ESCOPO FUNCIONAL */}
        <section
          id="modulos"
          className="bg-white border-y border-[#E6E6EA] py-20 sm:py-24"
          aria-labelledby="modulos-title"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 text-xs font-semibold">
                  02 · Escopo Funcional
                </span>
                <h2
                  id="modulos-title"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#16151A] mt-4"
                >
                  Tudo conectado<span className="text-[#FF4D5A]">.</span>
                </h2>
              </div>
              <p className="text-sm text-zinc-500 max-w-md">
                Cada sessão, personagem e pista investigativa conectada em um só lugar para toda a
                mesa consultar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <article className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 flex items-center justify-center">
                    <Clock className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E6E6EA] text-[11px] font-semibold text-zinc-600">
                    Cronologia
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#16151A] mb-2">
                    Linha do Tempo Interativa
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600">
                    Ordene acontecimentos no calendário gregoriano ou em calendários fictícios
                    personalizados, navegando entre escalas de anos, meses e dias.
                  </p>
                </div>
              </article>

              <article className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 flex items-center justify-center">
                    <Users className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E6E6EA] text-[11px] font-semibold text-zinc-600">
                    4 Categorias
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#16151A] mb-2">
                    Entidades &amp; Sessões
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600">
                    Vincule Personagens (PJ), NPCs, Localidades, Organizações e Sessões de Jogo a
                    cada evento e gere o histórico cronológico automaticamente.
                  </p>
                </div>
              </article>

              <article className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#E6E6EA] text-[11px] font-semibold text-zinc-600">
                    Permissões
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#16151A] mb-2">
                    Visibilidade em 3 Níveis
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600">
                    Classifique registros como Públicos, Privados ao Mestre ou Restritos a
                    jogadores específicos, com filtragem protegida diretamente no servidor.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* 03 / EXEMPLO DE CRONOLOGIA */}
        <section id="cronologia" className="bg-[#FAFAFB] py-20 sm:py-24" aria-labelledby="cronologia-title">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#FF4D5A]" aria-hidden="true" />
                03 · Dossiê em Ação
              </span>
              <h2
                id="cronologia-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#16151A] mt-4"
              >
                O que o Mestre cria, <span className="text-[#FF4D5A]">a mesa vive.</span>
              </h2>
              <p className="text-base text-zinc-600 mt-3 leading-relaxed">
                Cada acontecimento carrega seu nível de sigilo na mesma linha do tempo compartilhada.
                O Mestre enxerga o quadro completo; os jogadores descobrem apenas o que já veio à
                tona.
              </p>
            </div>

            <div className="bg-white border border-[#E6E6EA] rounded-3xl p-5 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#E6E6EA]">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#16151A]">
                  <D20Icon className="w-4 h-4 text-[#FF4D5A]" />
                  <span>Exemplo de Linha do Tempo · Ano 412</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FAFAFB] border border-[#E6E6EA] text-[11px] font-medium text-zinc-500">
                  Mestre &amp; Jogadores
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <article className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-zinc-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E6E6EA]">
                      <span className="font-mono text-xs text-zinc-500">14 de Brumário, 412</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-zinc-50 text-zinc-600 border border-[#E6E6EA]">
                        <Eye className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                        Público
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#16151A] leading-snug">
                      O Selo da Biblioteca Subterrânea
                    </h3>
                    <p className="text-xs mt-2 leading-relaxed text-zinc-600">
                      Visível para todos os jogadores da campanha, conectado ao PJ Vance e à
                      Sessão #04.
                    </p>
                  </div>
                </article>

                <article className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-zinc-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E6E6EA]">
                      <span className="font-mono text-xs text-zinc-500">19 de Brumário, 412</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <ShieldAlert className="w-3 h-3 text-amber-500" aria-hidden="true" />
                        Restrito
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#16151A] leading-snug">
                      A Carta Cifrada do Inquisidor
                    </h3>
                    <p className="text-xs mt-2 leading-relaxed text-zinc-600">
                      Liberado pelo Mestre exclusivamente para o jogador que decifrou o pergaminho.
                    </p>
                  </div>
                </article>

                <article className="bg-[#FAFAFB] border border-rose-200/80 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-rose-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-rose-200/60">
                      <span className="font-mono text-xs text-zinc-500">22 de Brumário, 412</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <Lock className="w-3 h-3 text-rose-500" aria-hidden="true" />
                        Privado GM
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#16151A] leading-snug">
                      Conspiração do Conclave
                    </h3>
                    <p className="text-xs mt-2 leading-relaxed text-zinc-600">
                      Registrado na mesma linha do tempo para controle do Mestre, 100% oculto dos
                      jogadores.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* 04 / FLUXO EM 3 PASSOS */}
        <section className="bg-white border-y border-[#E6E6EA] py-20 sm:py-24" aria-labelledby="passos-title">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[40%_60%] gap-12 items-start">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 text-xs font-semibold">
                04 · Como Participar
              </span>
              <h2
                id="passos-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#16151A] mt-4 mb-4"
              >
                Organize sua mesa em <span className="text-[#FF4D5A]">3 passos</span>.
              </h2>
              <p className="text-base text-zinc-600 max-w-md leading-relaxed">
                Crie múltiplas campanhas independentes, configure seu calendário narrativo e convide
                seu grupo em minutos.
              </p>
            </div>

            <ol className="space-y-4">
              <li className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                <span className="w-10 h-10 rounded-xl bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                  01
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[#16151A] mb-1.5">
                    Configure a campanha e o calendário
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Defina o sistema de RPG e escolha entre o calendário gregoriano ou um calendário
                    fictício com nomes e durações de meses personalizados.
                  </p>
                </div>
              </li>

              <li className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                <span className="w-10 h-10 rounded-xl bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                  02
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[#16151A] mb-1.5">
                    Cadastre entidades, sessões e eventos
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Registre personagens, NPCs, localidades e organizações e conecte-os aos
                    acontecimentos da linha do tempo com papéis narrativos.
                  </p>
                </div>
              </li>

              <li className="bg-[#FAFAFB] border border-[#E6E6EA] rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                <span className="w-10 h-10 rounded-xl bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                  03
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[#16151A] mb-1.5">
                    Convide jogadores e controle segredo e revelação
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Compartilhe códigos de convite com os jogadores e libere mistérios na linha do
                    tempo conforme a história avança na mesa.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* 05 / PERGUNTAS FREQUENTES */}
        <section id="perguntas" className="bg-[#FAFAFB] py-20 sm:py-24" aria-labelledby="faq-title">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[40%_60%] gap-12 items-start">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 text-xs font-semibold">
                05 · Perguntas Frequentes
              </span>
              <h2
                id="faq-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#16151A] mt-4"
              >
                Ainda tem <span className="text-[#FF4D5A]">dúvidas?</span>
              </h2>
              <p className="text-sm text-zinc-500 mt-3 max-w-sm leading-relaxed">
                Respostas rápidas sobre calendários customizados, permissões de sigilo e convites
                para a sua mesa.
              </p>
            </div>

            <div className="space-y-3">
              <details
                name="faq"
                className="faq-details group bg-white border border-[#E6E6EA] rounded-2xl px-6 py-4 shadow-sm hover:border-zinc-300 transition-colors"
              >
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-[#16151A] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D5A]/40">
                  <span>Posso usar calendários fictícios criados para o meu cenário?</span>
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-xl border border-[#E6E6EA] bg-[#FAFAFB] text-zinc-600 flex items-center justify-center shrink-0 group-open:bg-[#FF4D5A]/10 group-open:text-[#C42A3C] group-open:border-[#FF4D5A]/20 motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-180"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </summary>
                <p className="mt-3 pt-3 border-t border-[#E6E6EA] text-sm text-zinc-600 leading-relaxed">
                  Sim! Ao criar ou configurar uma campanha, você pode escolher entre o calendário
                  gregoriano ou definir os nomes e a quantidade de dias de cada mês do seu mundo,
                  além de cadastrar acontecimentos apenas com o ano ou com data aproximada.
                </p>
              </details>

              <details
                name="faq"
                className="faq-details group bg-white border border-[#E6E6EA] rounded-2xl px-6 py-4 shadow-sm hover:border-zinc-300 transition-colors"
              >
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-[#16151A] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D5A]/40">
                  <span>Os jogadores conseguem ver anotações privadas do Mestre?</span>
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-xl border border-[#E6E6EA] bg-[#FAFAFB] text-zinc-600 flex items-center justify-center shrink-0 group-open:bg-[#FF4D5A]/10 group-open:text-[#C42A3C] group-open:border-[#FF4D5A]/20 motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-180"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </summary>
                <p className="mt-3 pt-3 border-t border-[#E6E6EA] text-sm text-zinc-600 leading-relaxed">
                  Não. A filtragem de visibilidade (Público, Privado e Restrito) é executada
                  diretamente no servidor. Eventos e entidades privados jamais são trafegados para
                  contas com papel de Jogador.
                </p>
              </details>

              <details
                name="faq"
                className="faq-details group bg-white border border-[#E6E6EA] rounded-2xl px-6 py-4 shadow-sm hover:border-zinc-300 transition-colors"
              >
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-[#16151A] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D5A]/40">
                  <span>Como funcionam os convites para jogadores?</span>
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-xl border border-[#E6E6EA] bg-[#FAFAFB] text-zinc-600 flex items-center justify-center shrink-0 group-open:bg-[#FF4D5A]/10 group-open:text-[#C42A3C] group-open:border-[#FF4D5A]/20 motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-180"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </summary>
                <p className="mt-3 pt-3 border-t border-[#E6E6EA] text-sm text-zinc-600 leading-relaxed">
                  Na aba Participantes da campanha, o Mestre gera um token ou link de convite.
                  Basta o jogador acessar o link ou colar o código em seu painel para ingressar na
                  campanha.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* 06 / CLOSING CTA BANNER */}
        <section className="bg-white border-t border-[#E6E6EA] py-16 sm:py-20" aria-labelledby="cta-title">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-white via-[#FAFAFB] to-[#FF4D5A]/[0.06] border border-[#E6E6EA] rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D5A]/10 text-[#C42A3C] border border-[#FF4D5A]/20 text-xs font-semibold">
                  06 · Comece Agora
                </span>
                <h2
                  id="cta-title"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#16151A] mt-4"
                >
                  Tire sua campanha <span className="text-[#FF4D5A]">do papel.</span>
                </h2>
                <p className="text-base text-zinc-600 mt-3 leading-relaxed">
                  Crie sua conta gratuitamente, estruture sua linha do tempo colaborativa e
                  compartilhe o arquivo com sua mesa.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/register"}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(255,77,90,0.35)] hover:shadow-[0_6px_20px_rgba(255,77,90,0.45)] transition-all"
                >
                  <span>{isAuthenticated ? "Acessar Campanhas" : "Criar Minha Conta"}</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ LIMPO */}
      <footer className="bg-white border-t border-[#E6E6EA] text-[#16151A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-[#E6E6EA]">
          <BrandLogo size="md" />
          <p className="text-xs sm:text-sm text-zinc-500">
            Sistema web de gerenciamento de campanhas e linha do tempo interativa de RPG.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <span>Perímetro RPG · Linha do tempo colaborativa</span>
          <a
            href="#conteudo"
            className="inline-flex items-center gap-1.5 font-semibold text-[#C42A3C] hover:text-[#FF4D5A] transition-colors"
          >
            <span>Voltar ao topo</span>
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  );
};
