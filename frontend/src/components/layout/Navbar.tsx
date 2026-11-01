import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User as UserIcon, FolderKanban, Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f6f1e4] text-[#172e28] border-b-2 border-[#172e28]">
      <div className="wrap min-h-[78px] flex items-center justify-between gap-6">
        {/* Marca Geométrica da Referência */}
        <div className="flex items-center gap-8">
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="brand focus:outline-none"
            aria-label="Crônica — Voltar ao início"
          >
            <span className="brand-mark" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="brand-text">
              CRÔNICA
              <strong>ARQUIVO RPG</strong>
            </span>
          </Link>

          {isAuthenticated && (
            <nav aria-label="Navegação global" className="hidden md:flex items-center gap-6">
              <Link
                to="/dashboard"
                className={`inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.03em] transition-all px-3 py-1.5 border-2 ${
                  location.pathname === "/dashboard"
                    ? "bg-[#d8ff72] text-[#172e28] border-[#172e28] shadow-[3px_3px_0_#172e28]"
                    : "border-transparent text-[#172e28] hover:underline underline-offset-4"
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Minhas Campanhas
              </Link>
              <Link
                to="/campaigns/new"
                className={`inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.03em] transition-all px-3 py-1.5 border-2 ${
                  location.pathname === "/campaigns/new"
                    ? "bg-[#d8ff72] text-[#172e28] border-[#172e28] shadow-[3px_3px_0_#172e28]"
                    : "border-transparent text-[#172e28] hover:underline underline-offset-4"
                }`}
              >
                <Plus className="w-4 h-4" />
                Nova Campanha
              </Link>
            </nav>
          )}
        </div>

        {/* Links da Landing Page (idênticos à referência quando na home) */}
        {isLanding && !isAuthenticated && (
          <nav
            aria-label="Navegação da página inicial"
            className="hidden lg:flex items-center gap-7 ml-auto mr-4"
          >
            <a
              href="#proposito"
              className="text-[13px] font-bold uppercase tracking-[0.025em] text-[#172e28] hover:underline underline-offset-4"
            >
              O Propósito
            </a>
            <a
              href="#modulos"
              className="text-[13px] font-bold uppercase tracking-[0.025em] text-[#172e28] hover:underline underline-offset-4"
            >
              Módulos
            </a>
            <a
              href="#cronologia"
              className="text-[13px] font-bold uppercase tracking-[0.025em] text-[#172e28] hover:underline underline-offset-4"
            >
              Linha do Tempo
            </a>
            <a
              href="#perguntas"
              className="text-[13px] font-bold uppercase tracking-[0.025em] text-[#172e28] hover:underline underline-offset-4"
            >
              Perguntas
            </a>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <span className="header-note hidden xl:inline-flex items-center gap-2">
            LINHA DO TEMPO · RPG <span className="text-[#fa775d] font-bold">✳</span>
          </span>

          {isAuthenticated && user ? (
            <>
              <Link
                to="/profile"
                className={`inline-flex items-center gap-2.5 px-3 py-1.5 border-2 border-[#172e28] text-xs font-bold uppercase transition-all ${
                  location.pathname === "/profile"
                    ? "bg-[#d8ff72] text-[#172e28] shadow-[3px_3px_0_#172e28]"
                    : "bg-[#fffdf4] text-[#172e28] hover:bg-[#d8ff72] shadow-[3px_3px_0_#172e28]"
                }`}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`Foto de perfil de ${user.name}`}
                    className="w-6 h-6 rounded-full object-cover border border-[#172e28]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#fa775d] border border-[#172e28] flex items-center justify-center text-[#172e28] text-xs font-mono font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="font-bold text-xs text-[#172e28]">{user.name}</span>
                  <span className="font-mono text-[10px] text-[#587066] lowercase">
                    @{user.username}
                  </span>
                </div>
                <UserIcon className="w-3.5 h-3.5 text-[#172e28] sm:hidden" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Sair da conta"
                className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-[#172e28] bg-[#fffdf4] hover:bg-[#fa775d] text-[#172e28] text-xs font-mono font-bold uppercase tracking-wider shadow-[3px_3px_0_#172e28] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#172e28] border-2 border-[#172e28] bg-[#fffdf4] hover:bg-[#ffd2bb] shadow-[3px_3px_0_#172e28] transition-all"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#d8ff72] hover:bg-[#c8f550] text-[#172e28] border-2 border-[#172e28] shadow-[3px_3px_0_#172e28] inline-flex items-center gap-2 transition-all"
              >
                Criar Conta <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
