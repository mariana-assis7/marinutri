import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import { authClient } from './auth';

export default function App() {
  const [view, setView] = useState('login');
  
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      if (session) {
        setView('dashboard');
      } else if (view === 'dashboard') {
        setView('login');
      }
    }
  }, [session, isPending]);

  const navigateToDashboard = () => setView('dashboard');
  const navigateToLogin = () => setView('login');

  if (isPending) {
    return (
      <div className="auth-loading-container">
        <div className="auth-spinner"></div>
        <p>Verificando sessão...</p>
      </div>
    );
  }

  return (
    <>
      {view === 'login' && (
        <Login setView={setView} navigateToDashboard={navigateToDashboard} />
      )}
      {view === 'register' && (
        <Register setView={setView} navigateToDashboard={navigateToDashboard} />
      )}
      {view === 'dashboard' && (
        <Dashboard navigateToLogin={navigateToLogin} />
      )}
    </>
  );
}
