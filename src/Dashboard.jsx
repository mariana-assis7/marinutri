import React from 'react';
import { authClient } from './auth';

export default function Dashboard({ navigateToLogin }) {
  const { data: session, isPending } = authClient.useSession();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      navigateToLogin();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  if (isPending) {
    return (
      <div className="auth-loading-container">
        <div className="auth-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!session) {
    // If not authenticated, redirect to login
    navigateToLogin();
    return null;
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo-icon">🌿</span>
          <h2>Mari Nutri</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-item active">
            <span className="nav-icon">📊</span> Dashboard
          </a>
          <a href="#pacientes" className="nav-item">
            <span className="nav-icon">👥</span> Pacientes
          </a>
          <a href="#consultas" className="nav-item">
            <span className="nav-icon">📅</span> Consultas
          </a>
          <a href="#planos" className="nav-item">
            <span className="nav-icon">🍎</span> Planos Alimentares
          </a>
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-outline btn-logout" onClick={handleLogout}>
            <span className="btn-icon">🚪</span> Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="user-profile">
            <div className="avatar">
              {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'N'}
            </div>
            <div className="user-info">
              <span className="user-name">{session.user.name}</span>
              <span className="user-role">Nutricionista</span>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="welcome-banner">
            <h1>Olá, Dr(a). {session.user.name}!</h1>
            <p>Seja bem-vindo ao seu painel de controle. Aqui você pode gerenciar seus pacientes, consultas e planos alimentares de forma simples e eficiente.</p>
          </div>

          <div className="dashboard-grid">
            <div className="card stat-card">
              <h3>Total de Pacientes</h3>
              <p className="stat-number">0</p>
              <span className="stat-label">Cadastrados no sistema</span>
            </div>

            <div className="card stat-card">
              <h3>Consultas Agendadas</h3>
              <p className="stat-number">0</p>
              <span className="stat-label">Para os próximos dias</span>
            </div>

            <div className="card stat-card">
              <h3>Planos Alimentares</h3>
              <p className="stat-number">0</p>
              <span className="stat-label">Modelos ativos</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
