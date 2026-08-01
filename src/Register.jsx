import React, { useState, useEffect } from 'react';
import { authClient } from './auth';

export default function Register({ setView, navigateToDashboard }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      console.log('Sign-up response:', { data, signUpError });
      if (signUpError) {
        // Show specific error from auth client
        if (signUpError.code === 'EMAIL_ALREADY_IN_USE') {
          setError('Este e‑mail já está sendo utilizado.');
        } else if (signUpError.message) {
          setError(signUpError.message);
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
      } else {
        // Successful sign‑up, navigate to dashboard
        navigateToDashboard();
      }
    } catch (err) {
      console.error('Unexpected sign‑up error:', err);
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
            <span className="logo-icon">🌿</span>
            <h1>Mari Nutri</h1>
          </div>
          <p className="auth-subtitle">Gestão inteligente para nutricionistas</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Crie sua conta</h2>

          {error && <div className="auth-error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Nome completo</label>
            <input
              type="text"
              id="name"
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

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
            <label htmlFor="password">Senha (mínimo 6 caracteres)</label>
            <input
              type="password"
              id="password"
              placeholder="Crie uma senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirme a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Já tem conta?{' '}
            <button className="link-btn" onClick={() => setView('login')}>
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
