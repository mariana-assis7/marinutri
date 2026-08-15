import React, { useState, useEffect } from 'react';
import { authClient } from './auth';

export default function Login({ setView, navigateToDashboard }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if session is already active
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      navigateToDashboard();
    }
  }, [session, navigateToDashboard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        if (signInError.code === 'INVALID_EMAIL_OR_PASSWORD' || signInError.code === 'INVALID_CREDENTIALS') {
          setError('E-mail ou senha incorretos.');
        } else {
          setError(signInError.message || 'Erro ao realizar login. Tente novamente.');
        }
      } else {
        navigateToDashboard();
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/logo.png" alt="Mari Nutri" className="logo-img" />
            <h1>Mari Nutri</h1>
          </div>
          <p className="auth-subtitle">Gestão inteligente para nutricionistas</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Acesse sua conta</h2>

          {error && <div className="auth-error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Não tem conta?{' '}
            <button className="link-btn" onClick={() => setView('register')}>
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
