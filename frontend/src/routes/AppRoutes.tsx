import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingState } from "../components/ui/StateViews";
import { CampaignLayout } from "../components/layout/CampaignLayout";

import { LandingPage } from "../pages/auth/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ProfilePage } from "../pages/auth/ProfilePage";

import { UserDashboardPage } from "../pages/dashboard/UserDashboardPage";
import { CampaignFormPage } from "../pages/campaigns/CampaignFormPage";
import { CampaignDashboardPage } from "../pages/dashboard/CampaignDashboardPage";
import { TimelinePage } from "../pages/timeline/TimelinePage";
import { EventDetailPage } from "../pages/timeline/EventDetailPage";
import { EntitiesListPage } from "../pages/entities/EntitiesListPage";
import { EntityDetailPage } from "../pages/entities/EntityDetailPage";
import { SessionsListPage } from "../pages/sessions/SessionsListPage";
import { SessionDetailPage } from "../pages/sessions/SessionDetailPage";
import { CampaignMembersPage } from "../pages/campaigns/CampaignMembersPage";
import { AcceptInvitationPage } from "../pages/campaigns/AcceptInvitationPage";
import { CampaignSettingsPage } from "../pages/settings/CampaignSettingsPage";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <LoadingState message="Verificando sessão de autenticação..." />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <LoadingState message="Carregando..." />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Rotas Privadas do Usuário */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <UserDashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/campaigns/new"
        element={
          <PrivateRoute>
            <CampaignFormPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/invitations/:token/accept"
        element={
          <PrivateRoute>
            <AcceptInvitationPage />
          </PrivateRoute>
        }
      />

      {/* Rotas Internas da Campanha */}
      <Route
        path="/campaigns/:campaignId"
        element={
          <PrivateRoute>
            <CampaignLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<CampaignDashboardPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="events/:eventId" element={<EventDetailPage />} />
        <Route path="entities" element={<EntitiesListPage />} />
        <Route path="entities/:entityId" element={<EntityDetailPage />} />
        <Route path="sessions" element={<SessionsListPage />} />
        <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="members" element={<CampaignMembersPage />} />
        <Route path="settings" element={<CampaignSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
