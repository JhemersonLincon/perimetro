import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User as UserIcon, FolderKanban, Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { BrandLogo } from "../ui/DiceIcons";
import { ThemeToggleButton } from "../ui/ThemeToggleButton";

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E6E6EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[64px] flex items-center justify-between gap-6">
        {/* Marca: Perímetro com dados d20 e d6 */}
        <div className="flex items-center gap-8">
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="hover:opacity-90 transition-opacity"
            aria-label="Perímetro — Início"
          >
            <BrandLogo size="md" />
          </Link>

          {isAuthenticated && (
            <nav aria-label="Navegação global" className="hidden md:flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl transition-all ${
                  location.pathname === "/dashboard"
                    ? "bg-[#FF4D5A]/10 text-[#C42A3C] font-semibold"
                    : "text-zinc-600 hover:text-[#16151A] hover:bg-[#FAFAFB]"
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Minhas Campanhas
              </Link>
              <Link
                to="/campaigns/new"
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl transition-all ${
                  location.pathname === "/campaigns/new"
                    ? "bg-[#FF4D5A]/10 text-[#C42A3C] font-semibold"
                    : "text-zinc-600 hover:text-[#16151A] hover:bg-[#FAFAFB]"
                }`}
              >
                <Plus className="w-4 h-4 text-[#FF4D5A]" />
                Nova Campanha
              </Link>
            </nav>
          )}
        </div>

        {/* Links da Landing Page */}
        {isLanding && !isAuthenticated && (
          <nav
            aria-label="Navegação da página inicial"
            className="hidden lg:flex items-center gap-6 ml-auto mr-4 text-xs font-medium text-zinc-600"
          >
            <a href="#proposito" className="hover:text-[#16151A] transition-colors">
              O Propósito
            </a>
            <a href="#modulos" className="hover:text-[#16151A] transition-colors">
              Módulos
            </a>
            <a href="#cronologia" className="hover:text-[#16151A] transition-colors">
              Linha do Tempo
            </a>
            <a href="#perguntas" className="hover:text-[#16151A] transition-colors">
              Perguntas
            </a>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <ThemeToggleButton compactOnMobile />

          {isAuthenticated && user ? (
            <>
              <Link
                to="/profile"
                className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#E6E6EA] text-xs font-medium transition-all ${
                  location.pathname === "/profile"
                    ? "bg-[#FF4D5A]/10 border-[#FF4D5A]/30 text-[#C42A3C]"
                    : "bg-white text-[#16151A] hover:bg-[#FAFAFB]"
                }`}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`Foto de perfil de ${user.name}`}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#FF4D5A]/15 text-[#C42A3C] flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="font-semibold text-xs text-[#16151A]">{user.name}</span>
                </div>
                <UserIcon className="w-3.5 h-3.5 text-zinc-400 sm:hidden" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Sair da conta"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E6EA] bg-white hover:bg-[#FAFAFB] text-zinc-600 hover:text-rose-600 text-xs font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[#16151A] hover:bg-[#FAFAFB] transition-all"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FF4D5A] hover:bg-[#C42A3C] text-white shadow-[0_2px_10px_rgba(255,77,90,0.3)] transition-all"
              >
                Criar Conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
