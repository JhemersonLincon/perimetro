import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6f1e4] text-[#172e28] flex flex-col">
      <Navbar />

      <main id="conteudo" className="flex-1">
        {/* HERO SECTION — Idêntica à composição visual da referência */}
        <section className="ref-hero" aria-labelledby="hero-title">
          <div className="ref-hero-grid wrap">
            <div className="ref-hero-copy">
              <div className="eyebrow text-[#d8ff72] flex items-center gap-2.5">
                <span className="pulse-dot" aria-hidden="true" />
                PLATAFORMA DE GERENCIAMENTO NARRATIVO DE RPG
              </div>

              <h1 id="hero-title">
                HISTÓRIAS
                <br />
                QUE <em>SAEM</em>
                <br />
                DO PAPEL
              </h1>

              <p className="text-[18px] sm:text-[19px] leading-[1.45] max-w-[540px] text-[#e2e9d8]">
                Um ambiente centralizado para transformar anotações dispersas em uma linha do tempo
                interativa. Conecte acontecimentos, personagens, NPCs, localidades, organizações e
                sessões de jogo.
              </p>

              <div className="flex flex-wrap items-center gap-6 mt-9">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="ref-button ref-button-lime min-w-[230px]"
                  >
                    <span>Acessar Campanhas</span>
                    <span className="text-2xl leading-none" aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="ref-button ref-button-lime min-w-[215px]"
                    >
                      <span>Criar Conta</span>
                      <span className="text-2xl leading-none" aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                    <Link
                      to="/login"
                      className="text-sm font-bold text-[#fffdf4] underline underline-offset-4 hover:text-[#d8ff72] transition-colors"
                    >
                      Já possuo conta →
                    </Link>
                  </>
                )}
                <a
                  href="#proposito"
                  className="text-sm font-bold text-[#fffdf4] underline underline-offset-4 hover:text-[#d8ff72] transition-colors"
                >
                  Conheça a plataforma <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>

            {/* Ilustração Geométrica Inspirada na Referência */}
            <div className="hero-art" aria-hidden="true">
              <div className="art-stamp">
                HACK
                <br />
                YOUR
                <br />
                STORY<span>✳</span>
              </div>
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="art-core">
                <span>C</span>
                <i>✳</i>
              </div>
              <span className="art-label art-label-one">LINHA DO TEMPO</span>
              <span className="art-label art-label-two">MESTRES &amp; JOGADORES</span>
              <span className="art-spark art-spark-one">✦</span>
              <span className="art-spark art-spark-two">✳</span>
            </div>
          </div>

          <div className="hero-bottom wrap border-t border-white/35 min-h-[58px] flex flex-wrap items-center gap-6 sm:gap-10 py-3 text-[#fffdf4]">
            <span>MÚLTIPLAS CAMPANHAS</span>
            <span>CALENDÁRIO NARRATIVO</span>
            <span>CONTROLE DE VISIBILIDADE EM 3 NÍVEIS</span>
            <a
              href="#proposito"
              className="ml-auto text-[#d8ff72] inline-flex items-center gap-2 hover:underline"
            >
              ROLE PARA EXPLORAR <span className="text-base">↓</span>
            </a>
          </div>
        </section>

        {/* FAIXA TICKER ANIMADA */}
        <div
          className="ticker"
          aria-label="Experimentar, transformar, criar, colaborar, documentar"
        >
          <div className="ticker-track" aria-hidden="true">
            <span>
              EXPERIMENTAR <b>✳</b> TRANSFORMAR <b>✳</b> CRIAR <b>✳</b> COLABORAR <b>✳</b>{" "}
              ACONTECIMENTOS <b>✳</b> PERSONAGENS <b>✳</b> SESSÕES <b>✳</b> LOCALIDADES <b>✳</b>{" "}
              EXPERIMENTAR <b>✳</b> TRANSFORMAR <b>✳</b> CRIAR <b>✳</b> COLABORAR <b>✳</b>{" "}
              ACONTECIMENTOS <b>✳</b> PERSONAGENS <b>✳</b> SESSÕES <b>✳</b> LOCALIDADES <b>✳</b>
            </span>
          </div>
        </div>

        {/* 01 / O PROPÓSITO — Seção Creme Editorial */}
        <section
          id="proposito"
          className="bg-[#f6f1e4] text-[#172e28] py-20 sm:py-28"
          aria-labelledby="proposito-title"
        >
          <div className="wrap grid grid-cols-1 lg:grid-cols-[25%_75%] gap-8 items-start">
            <div className="section-index flex items-center gap-2.5 text-[#172e28] pt-2">
              <span className="text-[#fa775d] text-lg leading-none">✳</span>
              <span>01 / O PROPÓSITO</span>
            </div>

            <div>
              <h2
                id="proposito-title"
                className="font-display font-bold uppercase text-[clamp(44px,5.5vw,90px)] leading-[0.96] tracking-[-0.075em] mb-12"
              >
                HISTÓRIAS REAIS.
                <br />
                <span className="text-[#849687]">MUNDOS EM MOVIMENTO.</span>
              </h2>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <p className="text-[19px] sm:text-[21px] leading-[1.45] max-w-[600px] text-[#172e28]">
                  Informações narrativas que normalmente ficam dispersas em anotações, planilhas e
                  documentos ganham uma estrutura organizada, visualmente acessível e
                  interconectada ao redor de uma linha do tempo viva.
                </p>

                <div className="idea-doodle" aria-hidden="true">
                  <b className="text-[28px] text-[#fa775d] leading-none">✳</b>
                  <strong className="text-[26px] text-[#172e28]">CRÔNICA</strong>
                  <span className="font-mono text-[11px] tracking-widest uppercase">
                    ARQUIVO VIVO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 / OS PILARES E MÓDULOS — Seção Paper com Cards Brutalistas */}
        <section
          id="modulos"
          className="bg-[#fffdf4] text-[#172e28] border-t-2 border-[#172e28] py-20 sm:py-28"
          aria-labelledby="modulos-title"
        >
          <div className="wrap">
            <div className="flex items-center justify-between">
              <span className="section-index">02 / ESCOPO FUNCIONAL</span>
              <span className="text-2xl font-bold" aria-hidden="true">
                ↘
              </span>
            </div>

            <h2
              id="modulos-title"
              className="font-display font-bold uppercase text-[clamp(44px,5.2vw,86px)] leading-[0.96] tracking-[-0.075em] mt-8 mb-12"
            >
              TUDO CONECTADO<span className="accent-period">.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <article className="pillar-card bg-[#f6f1e4] min-h-[320px] justify-between">
                <div className="flex items-center justify-between border-b border-[#172e28] pb-3">
                  <span className="font-mono text-xs font-medium tracking-widest">01 / EIXO</span>
                  <span className="font-mono text-xs uppercase bg-[#172e28] text-[#fffdf4] px-2 py-0.5">
                    CRONOLOGIA
                  </span>
                </div>
                <div className="text-[54px] leading-none my-6 font-bold">◷</div>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-[-0.04em] mb-2">
                    LINHA DO TEMPO INTERATIVA
                  </h3>
                  <p className="text-[15px] leading-[1.5] text-[#172e28]/90">
                    Ordene acontecimentos no calendário gregoriano ou em calendários fictícios
                    personalizados, com filtros combináveis instantâneos.
                  </p>
                </div>
              </article>

              <article className="pillar-card bg-[#d8ff72] min-h-[320px] justify-between">
                <div className="flex items-center justify-between border-b border-[#172e28] pb-3">
                  <span className="font-mono text-xs font-medium tracking-widest">02 / REDE</span>
                  <span className="font-mono text-xs uppercase bg-[#172e28] text-[#d8ff72] px-2 py-0.5">
                    4 CATEGORIAS
                  </span>
                </div>
                <div className="text-[54px] leading-none my-6 font-bold">✦</div>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-[-0.04em] mb-2">
                    ENTIDADES &amp; SESSÕES
                  </h3>
                  <p className="text-[15px] leading-[1.5] text-[#172e28]/90">
                    Vincule Personagens (PJ), NPCs, Localidades, Organizações e Sessões de Jogo a
                    cada evento e gere o histórico cronológico automaticamente.
                  </p>
                </div>
              </article>

              <article className="pillar-card bg-[#ffd2bb] min-h-[320px] justify-between">
                <div className="flex items-center justify-between border-b border-[#172e28] pb-3">
                  <span className="font-mono text-xs font-medium tracking-widest">
                    03 / SEGURANÇA
                  </span>
                  <span className="font-mono text-xs uppercase bg-[#172e28] text-[#ffd2bb] px-2 py-0.5">
                    PERMISSÕES
                  </span>
                </div>
                <div className="text-[54px] leading-none my-6 font-bold">⛨</div>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-[-0.04em] mb-2">
                    VISIBILIDADE EM 3 NÍVEIS
                  </h3>
                  <p className="text-[15px] leading-[1.5] text-[#172e28]/90">
                    Classifique registros como Públicos, Privados ao Mestre ou Restritos a jogadores
                    específicos, com proteção validada no servidor.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* 03 / EXEMPLO DE CRONOLOGIA — Seção Coral Brutalista */}
        <section
          id="cronologia"
          className="bg-[#fa775d] text-[#172e28] border-y-2 border-[#172e28] py-20 sm:py-28 overflow-hidden"
          aria-labelledby="cronologia-title"
        >
          <div className="wrap grid grid-cols-1 lg:grid-cols-[36%_64%] gap-10">
            <div className="flex flex-col justify-between">
              <span className="section-index">03 / DOSSIÊ EM AÇÃO</span>
              <div
                aria-hidden="true"
                className="hidden lg:block text-[260px] font-bold leading-[0.75] tracking-[-0.15em] -rotate-12 text-[#d8ff72] select-none"
                style={{ textShadow: "10px 12px 0 #172e28" }}
              >
                RPG
              </div>
              <span className="font-mono text-xs uppercase tracking-widest">
                MESTRE (GM) &amp; JOGADORES
              </span>
            </div>

            <div className="lg:border-l-2 lg:border-[#172e28] lg:pl-14">
              <div className="status-chip inline-flex items-center gap-2.5 bg-[#172e28] text-[#fffdf4] px-3.5 py-2">
                <span className="w-2 h-2 rounded-full bg-[#d8ff72]" />
                EXEMPLO DE LINHA DO TEMPO COMPARTILHADA
              </div>

              <h2
                id="cronologia-title"
                className="font-display font-bold uppercase text-[clamp(42px,4.8vw,80px)] leading-[0.96] tracking-[-0.075em] my-7"
              >
                O QUE O MESTRE CRIA,{" "}
                <em className="not-italic text-[#d8ff72]">A MESA VIVE.</em>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-[#fffdf4] border-2 border-[#172e28] p-4 shadow-[5px_5px_0_#172e28]">
                  <div className="font-mono text-[10px] uppercase tracking-wider flex justify-between border-b border-[#172e28] pb-2 mb-3">
                    <span>14 DE BRUMÁRIO, 412</span>
                    <span className="bg-[#d8ff72] px-1.5 font-bold">PÚBLICO</span>
                  </div>
                  <h3 className="font-bold text-base uppercase leading-tight">
                    O Selo da Biblioteca Subterrânea
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed text-[#172e28]/80">
                    Visível para todos os jogadores da campanha, conectado ao PJ Vance e à Sessão #04.
                  </p>
                </div>

                <div className="bg-[#f6f1e4] border-2 border-[#172e28] p-4 shadow-[5px_5px_0_#172e28]">
                  <div className="font-mono text-[10px] uppercase tracking-wider flex justify-between border-b border-[#172e28] pb-2 mb-3">
                    <span>19 DE BRUMÁRIO, 412</span>
                    <span className="bg-[#ffd2bb] px-1.5 font-bold">RESTRITO</span>
                  </div>
                  <h3 className="font-bold text-base uppercase leading-tight">
                    A Carta Cifrada do Inquisidor
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed text-[#172e28]/80">
                    Liberado pelo Mestre exclusivamente para o jogador que decifrou o pergaminho.
                  </p>
                </div>

                <div className="bg-[#16332c] text-[#fffdf4] border-2 border-[#172e28] p-4 shadow-[5px_5px_0_#172e28]">
                  <div className="font-mono text-[10px] uppercase tracking-wider flex justify-between border-b border-white/30 pb-2 mb-3">
                    <span className="text-[#d8ff72]">22 DE BRUMÁRIO, 412</span>
                    <span className="bg-[#fa775d] text-[#172e28] px-1.5 font-bold">PRIVADO GM</span>
                  </div>
                  <h3 className="font-bold text-base uppercase leading-tight">
                    Conspiração do Conclave
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed text-[#e2e9d8]">
                    Registrado na mesma linha do tempo para controle do Mestre, 100% oculto dos
                    jogadores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 / FLUXO EM 3 PASSOS — Seção Deep Forest */}
        <section className="bg-[#16332c] text-[#fffdf4] py-20 sm:py-28">
          <div className="wrap grid grid-cols-1 lg:grid-cols-[44%_56%] gap-12">
            <div>
              <span className="section-index text-[#d8ff72]">04 / COMO PARTICIPAR</span>
              <h2 className="font-display font-bold uppercase text-[clamp(42px,4.8vw,80px)] leading-[0.96] tracking-[-0.075em] my-8">
                ORGANIZE SUA MESA EM{" "}
                <em className="not-italic text-[#fa775d]">3 PASSOS.</em>
              </h2>
              <p className="text-lg text-[#d8e4d5] max-w-md leading-relaxed">
                Crie múltiplas campanhas independentes, configure seu calendário narrativo e convide
                seu grupo.
              </p>
            </div>

            <div className="divide-y divide-white/35 border-y border-white/35">
              <div className="grid grid-cols-[54px_1fr_28px] gap-4 py-8 items-start">
                <span className="font-mono text-[#d8ff72] text-base">01</span>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-[-0.04em] mb-2">
                    CONFIGURE A CAMPANHA E O CALENDÁRIO
                  </h3>
                  <p className="text-[#d8e4d5] text-sm sm:text-base leading-relaxed">
                    Defina o sistema de RPG e escolha entre o calendário gregoriano ou um calendário
                    fictício com nomes e durações de meses personalizados.
                  </p>
                </div>
                <b className="text-[#d8ff72] text-2xl font-normal">✳</b>
              </div>

              <div className="grid grid-cols-[54px_1fr_28px] gap-4 py-8 items-start">
                <span className="font-mono text-[#d8ff72] text-base">02</span>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-[-0.04em] mb-2">
                    CADASTRE ENTIDADES, SESSÕES E EVENTOS
                  </h3>
                  <p className="text-[#d8e4d5] text-sm sm:text-base leading-relaxed">
                    Registre personagens, NPCs, localidades e organizações e conecte-os aos
                    acontecimentos da linha do tempo com papéis narrativos.
                  </p>
                </div>
                <b className="text-[#d8ff72] text-2xl font-normal">✳</b>
              </div>

              <div className="grid grid-cols-[54px_1fr_28px] gap-4 py-8 items-start">
                <span className="font-mono text-[#d8ff72] text-base">03</span>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-[-0.04em] mb-2">
                    CONVIDE JOGADORES E CONTROLE SEGREDO E REVELAÇÃO
                  </h3>
                  <p className="text-[#d8e4d5] text-sm sm:text-base leading-relaxed">
                    Compartilhe códigos de convite com os jogadores e libere mistérios na linha do
                    tempo conforme a história avança na mesa.
                  </p>
                </div>
                <b className="text-[#d8ff72] text-2xl font-normal">✳</b>
              </div>
            </div>
          </div>
        </section>

        {/* 05 / PERGUNTAS FREQUENTES — Seção Creme com Accordion */}
        <section
          id="perguntas"
          className="bg-[#f6f1e4] text-[#172e28] border-t-2 border-[#172e28] py-20 sm:py-28"
          aria-labelledby="faq-title"
        >
          <div className="wrap grid grid-cols-1 lg:grid-cols-[42%_58%] gap-12">
            <div>
              <span className="section-index">05 / PERGUNTAS FREQUENTES</span>
              <h2
                id="faq-title"
                className="font-display font-bold uppercase text-[clamp(44px,5vw,82px)] leading-[0.96] tracking-[-0.075em] mt-8"
              >
                AINDA TEM
                <br />
                <em className="not-italic text-[#fa775d]">DÚVIDAS?</em>
              </h2>
            </div>

            <div className="divide-y-2 divide-[#172e28] border-y-2 border-[#172e28]">
              <details className="group py-5">
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4 font-bold text-xl tracking-[-0.03em]">
                  <span>Posso usar calendários fictícios criados para o meu cenário?</span>
                  <span className="w-8 h-8 rounded-full border-2 border-[#172e28] grid place-items-center text-xl group-open:rotate-45 group-open:bg-[#d8ff72] transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[#4b6158] leading-relaxed">
                  Sim! Ao criar ou configurar uma campanha, você pode escolher entre o calendário
                  gregoriano ou definir os nomes e a quantidade de dias de cada mês do seu mundo,
                  além de cadastrar acontecimentos com data desconhecida.
                </p>
              </details>

              <details className="group py-5">
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4 font-bold text-xl tracking-[-0.03em]">
                  <span>Os jogadores conseguem ver anotações privadas do Mestre?</span>
                  <span className="w-8 h-8 rounded-full border-2 border-[#172e28] grid place-items-center text-xl group-open:rotate-45 group-open:bg-[#d8ff72] transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[#4b6158] leading-relaxed">
                  Não. A filtragem de visibilidade (Público, Privado e Restrito) é executada
                  diretamente no servidor. Eventos e entidades privados jamais são trafegados para
                  contas com papel de Jogador.
                </p>
              </details>

              <details className="group py-5">
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4 font-bold text-xl tracking-[-0.03em]">
                  <span>Como funcionam os convites para jogadores?</span>
                  <span className="w-8 h-8 rounded-full border-2 border-[#172e28] grid place-items-center text-xl group-open:rotate-45 group-open:bg-[#d8ff72] transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[#4b6158] leading-relaxed">
                  Na aba Participantes da campanha, o Mestre gera um token/link de convite. Basta o
                  jogador acessar o link ou colar o código em seu painel para ingressar na campanha.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* CLOSING CTA BANNER — Lime Brutalista */}
        <section className="bg-[#d8ff72] text-[#172e28] border-y-2 border-[#172e28] py-20 relative overflow-hidden">
          <div className="wrap grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8 items-end relative z-10">
            <div>
              <span className="section-index">06 / COMECE AGORA</span>
              <h2 className="font-display font-bold uppercase text-[clamp(48px,5.8vw,96px)] leading-[0.94] tracking-[-0.08em] mt-5">
                TIRE SUA CAMPANHA{" "}
                <em
                  className="not-italic text-[#fa775d]"
                  style={{ textShadow: "3px 3px 0 #172e28" }}
                >
                  DO PAPEL.
                </em>
              </h2>
            </div>

            <div className="flex flex-col items-start gap-5">
              <p className="text-lg font-medium leading-snug max-w-sm">
                Crie sua conta gratuitamente, estruture sua linha do tempo e compartilhe o arquivo
                com sua mesa.
              </p>
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="ref-button ref-button-dark min-w-[230px]"
              >
                <span>{isAuthenticated ? "Ir ao Painel" : "Criar Minha Conta"}</span>
                <span className="text-2xl leading-none" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ DEEP FOREST */}
      <footer className="bg-[#16332c] text-[#fffdf4]">
        <div className="wrap py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/25">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="brand-text !text-[#fffdf4]">
              CRÔNICA
              <strong className="text-[#d8ff72]">ARQUIVO RPG</strong>
            </span>
          </div>

          <div className="font-mono text-xs uppercase tracking-widest text-[#d8e4d5]">
            SISTEMA WEB DE GERENCIAMENTO DE CAMPANHAS E LINHA DO TEMPO INTERATIVA
          </div>
        </div>

        <div className="wrap py-5 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-wider text-[#d8e4d5]">
          <span>MVP v1.0 · PLATAFORMA CRÔNICA</span>
          <a href="#conteudo" className="text-[#d8ff72] hover:underline">
            VOLTAR AO TOPO ↑
          </a>
        </div>
      </footer>
    </div>
  );
};
