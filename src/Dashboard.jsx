import React, { useState, useEffect } from 'react';
import { authClient } from './auth';
import { fetchPacientes, fetchConsultas, createPaciente, createConsulta } from './api';

export default function Dashboard({ navigateToLogin }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'pacientes', 'paciente-perfil'
  const [pacientes, setPacientes] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation & Sub-states
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);
  const [isRegisteringPaciente, setIsRegisteringPaciente] = useState(false);
  const [isRecordingConsulta, setIsRecordingConsulta] = useState(false);

  // Form states for New Paciente
  const [newPacienteNome, setNewPacienteNome] = useState('');
  const [newPacienteEmail, setNewPacienteEmail] = useState('');
  const [newPacienteWhatsapp, setNewPacienteWhatsapp] = useState('');
  const [newPacienteNascimento, setNewPacienteNascimento] = useState('');
  const [newPacienteSexo, setNewPacienteSexo] = useState('Feminino');
  const [newPacientePeso, setNewPacientePeso] = useState('');
  const [newPacienteAltura, setNewPacienteAltura] = useState('');

  // Form states for New Consulta
  const [newConsultaData, setNewConsultaData] = useState(new Date().toISOString().split('T')[0]);
  const [newConsultaPeso, setNewConsultaPeso] = useState('');
  const [newConsultaCintura, setNewConsultaCintura] = useState('');
  const [newConsultaQuadril, setNewConsultaQuadril] = useState('');
  const [newConsultaGordura, setNewConsultaGordura] = useState('');
  const [newConsultaProximoRetorno, setNewConsultaProximoRetorno] = useState('');
  const [newConsultaObs, setNewConsultaObs] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pacientesData, consultasList] = await Promise.all([
        fetchPacientes(),
        fetchConsultas()
      ]);
      setPacientes(pacientesData || []);
      setConsultas(consultasList || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(`Não foi possível carregar os dados: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      navigateToLogin();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  if (sessionPending) {
    return (
      <div className="auth-loading-container">
        <div className="auth-spinner"></div>
        <p>Carregando sessão...</p>
      </div>
    );
  }

  if (!session) {
    navigateToLogin();
    return null;
  }

  // Helper date parsing (avoid local timezone conversion bugs)
  const parseLocalDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00');
  };

  // 1. Total de pacientes ativos
  const totalPacientes = pacientes.length;

  // 2. Consultas da semana
  const now = new Date();
  const getStartOfWeek = (d) => {
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    const sunday = new Date(d.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  };
  const startOfWeek = getStartOfWeek(new Date(now));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const consultasSemana = consultas.filter(c => {
    const cDate = parseLocalDate(c.data_consulta);
    return cDate >= startOfWeek && cDate <= endOfWeek;
  }).length;

  // 3. Pacientes sem retorno
  // - Última consulta há mais de 30 dias
  // - Sem retorno futuro agendado
  const getPacientesSemRetornoList = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pacientes.filter(p => {
      const pConsultas = consultas.filter(c => c.paciente_id === p.id);
      if (pConsultas.length === 0) return false;

      // Encontrar consulta mais recente
      pConsultas.sort((a, b) => parseLocalDate(b.data_consulta) - parseLocalDate(a.data_consulta));
      const latest = pConsultas[0];
      const lastDate = parseLocalDate(latest.data_consulta);

      const diffDays = (today - lastDate) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        // Verificar se tem consulta ou retorno futuro
        const hasFutureReturn = latest.proximo_retorno && parseLocalDate(latest.proximo_retorno) > today;
        return !hasFutureReturn;
      }
      return false;
    });
  };

  const pacientesSemRetorno = getPacientesSemRetornoList();

  const handleRegisterPaciente = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPacienteNome) {
      setError('O nome é obrigatório.');
      return;
    }

    try {
      const pData = {
        nutricionista_id: session.user.id,
        nome: newPacienteNome,
        email: newPacienteEmail || null,
        whatsapp: newPacienteWhatsapp || null,
        data_nascimento: newPacienteNascimento || null,
        sexo: newPacienteSexo,
        peso_inicial: newPacientePeso ? parseFloat(newPacientePeso) : null,
        altura: newPacienteAltura ? parseFloat(newPacienteAltura) : null,
        objetivos: [],
        patologias: [],
        restricoes_alimentares: [],
        alergias: []
      };

      await createPaciente(pData);
      
      // Reset form
      setNewPacienteNome('');
      setNewPacienteEmail('');
      setNewPacienteWhatsapp('');
      setNewPacienteNascimento('');
      setNewPacientePeso('');
      setNewPacienteAltura('');
      setIsRegisteringPaciente(false);

      // Reload
      await loadData();
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      setError(`Erro ao salvar paciente no banco: ${err.message || err}`);
    }
  };

  const handleRegisterConsulta = async (e) => {
    e.preventDefault();
    setError('');
    if (!newConsultaData) {
      setError('A data da consulta é obrigatória.');
      return;
    }

    try {
      const cData = {
        paciente_id: selectedPacienteId,
        data_consulta: newConsultaData,
        peso: newConsultaPeso ? parseFloat(newConsultaPeso) : null,
        cintura: newConsultaCintura ? parseFloat(newConsultaCintura) : null,
        quadril: newConsultaQuadril ? parseFloat(newConsultaQuadril) : null,
        percentual_gordura: newConsultaGordura ? parseFloat(newConsultaGordura) : null,
        proximo_retorno: newConsultaProximoRetorno || null,
        observacoes: newConsultaObs || null
      };

      await createConsulta(cData);

      // Reset form
      setNewConsultaData(new Date().toISOString().split('T')[0]);
      setNewConsultaPeso('');
      setNewConsultaCintura('');
      setNewConsultaQuadril('');
      setNewConsultaGordura('');
      setNewConsultaProximoRetorno('');
      setNewConsultaObs('');
      setIsRecordingConsulta(false);

      // Reload
      await loadData();
    } catch (err) {
      console.error('Erro ao registrar consulta:', err);
      setError(`Erro ao salvar consulta no banco: ${err.message || err}`);
    }
  };

  const viewPacienteProfile = (pId) => {
    setSelectedPacienteId(pId);
    setActiveTab('paciente-perfil');
  };

  const selectedPaciente = pacientes.find(p => p.id === selectedPacienteId);
  const selectedPacienteConsultas = consultas
    .filter(c => c.paciente_id === selectedPacienteId)
    .sort((a, b) => parseLocalDate(b.data_consulta) - parseLocalDate(a.data_consulta));

  return (
    <div className="dashboard-layout">
      {/* Sidebar Fixo */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo-icon">🌿</span>
          <h2>MariNutri</h2>
        </div>
        <nav className="sidebar-nav">
          <a 
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); setSelectedPacienteId(null); setIsRegisteringPaciente(false); }} 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <span className="nav-icon">📊</span> Dashboard
          </a>
          <a 
            href="#pacientes"
            onClick={(e) => { e.preventDefault(); setActiveTab('pacientes'); setSelectedPacienteId(null); setIsRegisteringPaciente(false); }} 
            className={`nav-item ${activeTab === 'pacientes' || activeTab === 'paciente-perfil' ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <span className="nav-icon">👥</span> Pacientes
          </a>
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-outline btn-logout" onClick={handleLogout}>
            <span className="btn-icon">🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
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

        {loading ? (
          <div className="auth-loading-container" style={{ minHeight: '50vh' }}>
            <div className="auth-spinner"></div>
            <p>Sincronizando dados com o Neon...</p>
          </div>
        ) : (
          <section className="dashboard-content">
            {error && <div className="auth-error-message">{error}</div>}

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <>
                <div className="welcome-banner">
                  <h1>Olá, Dr(a). {session.user.name}!</h1>
                  <p>Seja bem-vindo ao seu painel de controle. Aqui você acompanha seus pacientes e consultas sincronizados em tempo real.</p>
                </div>

                <div className="dashboard-grid">
                  {/* Card 1: Total de pacientes */}
                  <div className="card stat-card">
                    <h3>Total de Pacientes Ativos</h3>
                    <p className="stat-number">{totalPacientes}</p>
                    <span className="stat-label">Cadastrados e sob seus cuidados</span>
                  </div>

                  {/* Card 2: Consultas da semana */}
                  <div className="card stat-card">
                    <h3>Consultas da Semana</h3>
                    <p className="stat-number">{consultasSemana}</p>
                    <span className="stat-label">Registradas para a semana atual</span>
                  </div>

                  {/* Card 3: Pacientes sem retorno */}
                  <div className="card stat-card" style={{ gridColumn: 'span 1' }}>
                    <h3>Pacientes Sem Retorno</h3>
                    {pacientesSemRetorno.length === 0 ? (
                      <p className="empty-state" style={{ padding: '20px 0', fontSize: '0.95rem' }}>
                        Nenhum paciente sem retorno no momento.
                      </p>
                    ) : (
                      <ul className="sem-retorno-list">
                        {pacientesSemRetorno.map(p => {
                          const pConsultas = consultas.filter(c => c.paciente_id === p.id);
                          pConsultas.sort((a, b) => parseLocalDate(b.data_consulta) - parseLocalDate(a.data_consulta));
                          const lastDate = parseLocalDate(pConsultas[0].data_consulta);
                          const days = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));

                          return (
                            <li key={p.id} className="sem-retorno-item">
                              <span 
                                className="sem-retorno-link"
                                onClick={() => viewPacienteProfile(p.id)}
                              >
                                {p.nome}
                              </span>
                              <span className="sem-retorno-days">há {days} dias</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* TAB: PACIENTES */}
            {activeTab === 'pacientes' && !isRegisteringPaciente && (
              <div className="form-card">
                <div className="section-header">
                  <h2>Pacientes</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsRegisteringPaciente(true)}>
                    + Novo Paciente
                  </button>
                </div>

                {pacientes.length === 0 ? (
                  <div className="empty-state card">
                    <p>Nenhum paciente cadastrado no momento. Comece adicionando um novo paciente!</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>E-mail</th>
                          <th>WhatsApp</th>
                          <th>Gênero</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pacientes.map(p => {
                          const pConsultas = consultas.filter(c => c.paciente_id === p.id);
                          const hasSemRetorno = pacientesSemRetorno.some(sr => sr.id === p.id);
                          return (
                            <tr key={p.id} onClick={() => viewPacienteProfile(p.id)}>
                              <td className="patient-row-name">{p.nome}</td>
                              <td>{p.email || '-'}</td>
                              <td>{p.whatsapp || '-'}</td>
                              <td>{p.sexo}</td>
                              <td>
                                {pConsultas.length === 0 ? (
                                  <span className="badge badge-warning">Sem consulta</span>
                                ) : hasSemRetorno ? (
                                  <span className="badge badge-warning">Sem retorno</span>
                                ) : (
                                  <span className="badge badge-success">Em dia</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PACIENTES -> CADASTRAR */}
            {activeTab === 'pacientes' && isRegisteringPaciente && (
              <div className="card form-card">
                <button className="btn-back" onClick={() => setIsRegisteringPaciente(false)}>
                  ← Voltar para listagem
                </button>
                <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-bordeaux-dark)', marginBottom: '24px' }}>
                  Cadastrar Novo Paciente
                </h2>
                <form onSubmit={handleRegisterPaciente}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nome Completo *</label>
                      <input 
                        type="text" 
                        value={newPacienteNome} 
                        onChange={e => setNewPacienteNome(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>E-mail</label>
                      <input 
                        type="email" 
                        value={newPacienteEmail} 
                        onChange={e => setNewPacienteEmail(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>WhatsApp</label>
                      <input 
                        type="text" 
                        placeholder="(00) 00000-0000"
                        value={newPacienteWhatsapp} 
                        onChange={e => setNewPacienteWhatsapp(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Data de Nascimento</label>
                      <input 
                        type="date" 
                        value={newPacienteNascimento} 
                        onChange={e => setNewPacienteNascimento(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Sexo / Gênero</label>
                      <select 
                        value={newPacienteSexo} 
                        onChange={e => setNewPacienteSexo(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '1.5px solid var(--color-border)',
                          borderRadius: 'var(--border-radius-md)',
                          backgroundColor: 'var(--color-bg-base)',
                          fontSize: '1rem',
                        }}
                      >
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Peso Inicial (kg)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={newPacientePeso} 
                        onChange={e => setNewPacientePeso(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Altura (m)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={newPacienteAltura} 
                        onChange={e => setNewPacienteAltura(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setIsRegisteringPaciente(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Salvar Paciente
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: PERFIL DO PACIENTE */}
            {activeTab === 'paciente-perfil' && selectedPaciente && (
              <div>
                <button className="btn-back" onClick={() => { setActiveTab('pacientes'); setIsRecordingConsulta(false); }}>
                  ← Voltar para listagem
                </button>

                <div className="profile-grid">
                  {/* Left Column: Personal info */}
                  <div className="profile-card">
                    <div className="profile-avatar-container">
                      <div className="profile-avatar">
                        {selectedPaciente.nome.charAt(0).toUpperCase()}
                      </div>
                      <h3>{selectedPaciente.nome}</h3>
                    </div>

                    <div className="profile-info-list">
                      <div className="profile-info-item">
                        <span className="profile-info-label">E-mail</span>
                        <p className="profile-info-value">{selectedPaciente.email || '-'}</p>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">WhatsApp</span>
                        <p className="profile-info-value">{selectedPaciente.whatsapp || '-'}</p>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Gênero</span>
                        <p className="profile-info-value">{selectedPaciente.sexo || '-'}</p>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Nascimento</span>
                        <p className="profile-info-value">{selectedPaciente.data_nascimento || '-'}</p>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Peso Inicial</span>
                        <p className="profile-info-value">
                          {selectedPaciente.peso_inicial ? `${selectedPaciente.peso_inicial} kg` : '-'}
                        </p>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Altura</span>
                        <p className="profile-info-value">
                          {selectedPaciente.altura ? `${selectedPaciente.altura} m` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Consultas history */}
                  <div className="card">
                    <div className="section-header" style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-bordeaux-dark)', fontSize: '1.4rem' }}>
                        Histórico de Consultas
                      </h3>
                      {!isRecordingConsulta && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setIsRecordingConsulta(true)}>
                          + Nova Consulta
                        </button>
                      )}
                    </div>

                    {isRecordingConsulta ? (
                      <div className="form-card" style={{ border: '1px solid var(--color-border)', padding: '20px', borderRadius: 'var(--border-radius-md)', marginBottom: '24px' }}>
                        <h4 style={{ marginBottom: '16px', color: 'var(--color-bordeaux)' }}>Registrar Nova Consulta</h4>
                        <form onSubmit={handleRegisterConsulta}>
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Data da Consulta *</label>
                              <input 
                                type="date" 
                                value={newConsultaData} 
                                onChange={e => setNewConsultaData(e.target.value)} 
                                required 
                              />
                            </div>
                            <div className="form-group">
                              <label>Peso Atual (kg)</label>
                              <input 
                                type="number" 
                                step="0.1" 
                                value={newConsultaPeso} 
                                onChange={e => setNewConsultaPeso(e.target.value)} 
                              />
                            </div>
                            <div className="form-group">
                              <label>Cintura (cm)</label>
                              <input 
                                type="number" 
                                step="0.1" 
                                value={newConsultaCintura} 
                                onChange={e => setNewConsultaCintura(e.target.value)} 
                              />
                            </div>
                          </div>

                          <div className="form-grid">
                            <div className="form-group">
                              <label>Quadril (cm)</label>
                              <input 
                                type="number" 
                                step="0.1" 
                                value={newConsultaQuadril} 
                                onChange={e => setNewConsultaQuadril(e.target.value)} 
                              />
                            </div>
                            <div className="form-group">
                              <label>% Gordura</label>
                              <input 
                                type="number" 
                                step="0.1" 
                                value={newConsultaGordura} 
                                onChange={e => setNewConsultaGordura(e.target.value)} 
                              />
                            </div>
                            <div className="form-group">
                              <label>Próximo Retorno</label>
                              <input 
                                type="date" 
                                value={newConsultaProximoRetorno} 
                                onChange={e => setNewConsultaProximoRetorno(e.target.value)} 
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Observações</label>
                            <textarea 
                              value={newConsultaObs} 
                              onChange={e => setNewConsultaObs(e.target.value)} 
                              rows="3"
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '1.5px solid var(--color-border)',
                                borderRadius: 'var(--border-radius-md)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '1rem',
                                resize: 'vertical'
                              }}
                            />
                          </div>

                          <div className="form-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setIsRecordingConsulta(false)}>
                              Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary">
                              Registrar Consulta
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : null}

                    {selectedPacienteConsultas.length === 0 ? (
                      <p className="empty-state">Nenhuma consulta registrada para este paciente ainda.</p>
                    ) : (
                      <div className="consultas-history-list">
                        {selectedPacienteConsultas.map(c => (
                          <div key={c.id} className="consulta-history-item">
                            <div className="consulta-history-header">
                              <span className="consulta-history-date">
                                📅 Consulta em {c.data_consulta.split('-').reverse().join('/')}
                              </span>
                              {c.proximo_retorno && (
                                <span className="badge badge-success">
                                  Retorno: {c.proximo_retorno.split('-').reverse().join('/')}
                                </span>
                              )}
                            </div>
                            <div className="consulta-history-stats">
                              <div className="consulta-stat-box">
                                <span className="consulta-stat-label">Peso</span>
                                <p className="consulta-stat-value">{c.peso ? `${c.peso} kg` : '-'}</p>
                              </div>
                              <div className="consulta-stat-box">
                                <span className="consulta-stat-label">Cintura</span>
                                <p className="consulta-stat-value">{c.cintura ? `${c.cintura} cm` : '-'}</p>
                              </div>
                              <div className="consulta-stat-box">
                                <span className="consulta-stat-label">Quadril</span>
                                <p className="consulta-stat-value">{c.quadril ? `${c.quadril} cm` : '-'}</p>
                              </div>
                              <div className="consulta-stat-box">
                                <span className="consulta-stat-label">% Gordura</span>
                                <p className="consulta-stat-value">{c.percentual_gordura ? `${c.percentual_gordura}%` : '-'}</p>
                              </div>
                            </div>
                            {c.observacoes && (
                              <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                <strong>Obs:</strong> {c.observacoes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
