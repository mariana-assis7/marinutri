import React, { useState, useEffect } from 'react';
import { authClient } from './auth';
import { fetchPacientes, fetchConsultas, createPaciente, createConsulta } from './api';

export default function Dashboard({ navigateToLogin }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'pacientes', 'paciente-cadastro', 'paciente-perfil'
  const [pacientes, setPacientes] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sub-states & Search
  const [selectedPacienteId, setSelectedPacienteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordingConsulta, setIsRecordingConsulta] = useState(false);

  // Form step (tab) inside registration form
  const [formTab, setFormTab] = useState('pessoal'); // 'pessoal', 'clinico', 'habitos'

  // ==========================================
  // Form states for New Paciente (Aba 1 - Pessoal)
  // ==========================================
  const [newPacienteNome, setNewPacienteNome] = useState('');
  const [newPacienteNascimento, setNewPacienteNascimento] = useState('');
  const [newPacienteSexo, setNewPacienteSexo] = useState('Feminino');
  const [newPacienteTelefone, setNewPacienteTelefone] = useState('');
  const [newPacienteWhatsapp, setNewPacienteWhatsapp] = useState('');
  const [newPacienteEmail, setNewPacienteEmail] = useState('');

  // ==========================================
  // Form states for New Paciente (Aba 2 - Clínico)
  // ==========================================
  const [newPacientePeso, setNewPacientePeso] = useState('');
  const [newPacienteAltura, setNewPacienteAltura] = useState('');
  const [selectedObjetivos, setSelectedObjetivos] = useState([]);
  const [newPacienteObjetivoTexto, setNewPacienteObjetivoTexto] = useState('');
  const [newPacienteNivelAtividade, setNewPacienteNivelAtividade] = useState('Sedentário');
  const [selectedPatologias, setSelectedPatologias] = useState([]);
  const [newPacientePatologiaCustom, setNewPacientePatologiaCustom] = useState('');
  const [selectedRestricoes, setSelectedRestricoes] = useState([]);
  const [newPacienteRestricaoCustom, setNewPacienteRestricaoCustom] = useState('');
  const [selectedAlergias, setSelectedAlergias] = useState([]);
  const [newPacienteAlergiaCustom, setNewPacienteAlergiaCustom] = useState('');
  const [newPacienteMedicamentos, setNewPacienteMedicamentos] = useState('');
  const [newPacienteSuplementos, setNewPacienteSuplementos] = useState('');

  // ==========================================
  // Form states for New Paciente (Aba 3 - Hábitos)
  // ==========================================
  const [newPacienteRefeicoes, setNewPacienteRefeicoes] = useState('');
  const [newPacienteHorarioAcorda, setNewPacienteHorarioAcorda] = useState('');
  const [newPacienteHorarioDorme, setNewPacienteHorarioDorme] = useState('');
  const [newPacienteAgua, setNewPacienteAgua] = useState('');
  const [newPacienteAtividadeFisica, setNewPacienteAtividadeFisica] = useState('Não');
  const [newPacienteAtividadeFisicaDesc, setNewPacienteAtividadeFisicaDesc] = useState('');
  const [newPacienteObs, setNewPacienteObs] = useState('');

  // ==========================================
  // Form states for New Consulta
  // ==========================================
  const [newConsultaData, setNewConsultaData] = useState(new Date().toISOString().split('T')[0]);
  const [newConsultaPeso, setNewConsultaPeso] = useState('');
  const [newConsultaCintura, setNewConsultaCintura] = useState('');
  const [newConsultaQuadril, setNewConsultaQuadril] = useState('');
  const [newConsultaGordura, setNewConsultaGordura] = useState('');
  const [newConsultaProximoRetorno, setNewConsultaProximoRetorno] = useState('');
  const [newConsultaObs, setNewConsultaObs] = useState('');

  // ==========================================
  // Helper calculations & Formatters
  // ==========================================

  // Date parser (avoid local timezone conversion bugs)
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr + 'T00:00:00');
  };

  // Age Calculator
  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dob = parseLocalDate(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Phone Formatter (e.g. (11) 98888-8888 or (11) 4444-4444)
  const formatPhone = (val) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length === 0) return '';
    if (clean.length <= 2) return `(${clean}`;
    if (clean.length <= 6) return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
    if (clean.length <= 10) return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
  };

  // Time Number Converter (e.g. 6 -> 06:00, 630 -> 06:30, 2230 -> 22:30)
  const formatTimeNumber = (val) => {
    const clean = val.toString().replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 1) return `0${clean}:00`;
    if (clean.length === 2) {
      const num = parseInt(clean);
      if (num >= 0 && num <= 23) return `${clean}:00`;
      return '';
    }
    if (clean.length === 3) {
      const hours = `0${clean.substring(0, 1)}`;
      const minutes = clean.substring(1);
      return `${hours}:${minutes}`;
    }
    if (clean.length >= 4) {
      const hours = clean.substring(0, 2);
      const minutes = clean.substring(2, 4);
      return `${hours}:${minutes}`;
    }
    return '';
  };

  const handleTimeBlur = (val, setter) => {
    const formatted = formatTimeNumber(val);
    if (formatted) setter(formatted);
  };

  // IMC Calculator
  const getIMC = () => {
    if (!newPacientePeso || !newPacienteAltura) return '';
    const weight = parseFloat(newPacientePeso);
    const height = parseFloat(newPacienteAltura) / 100;
    if (weight > 0 && height > 0) {
      return (weight / (height * height)).toFixed(1);
    }
    return '';
  };

  // Checkbox change handler (with "Nenhum" mutual exclusion support)
  const handleCheckboxChange = (item, list, setList, isNenhum = false) => {
    if (isNenhum) {
      if (list.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
    } else {
      let updated = list.filter(x => x !== 'Nenhum');
      if (updated.includes(item)) {
        updated = updated.filter(x => x !== item);
      } else {
        updated.push(item);
      }
      setList(updated);
    }
  };

  // Load Data from API
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

  // ==========================================
  // Stat calculations
  // ==========================================

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
  const getPacientesSemRetornoList = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pacientes.filter(p => {
      const pConsultas = consultas.filter(c => c.paciente_id === p.id);
      if (pConsultas.length === 0) return false;

      pConsultas.sort((a, b) => parseLocalDate(b.data_consulta) - parseLocalDate(a.data_consulta));
      const latest = pConsultas[0];
      const lastDate = parseLocalDate(latest.data_consulta);

      const diffDays = (today - lastDate) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        const hasFutureReturn = latest.proximo_retorno && parseLocalDate(latest.proximo_retorno) > today;
        return !hasFutureReturn;
      }
      return false;
    });
  };

  const pacientesSemRetorno = getPacientesSemRetornoList();

  // Filter patients by search query
  const filteredPacientes = pacientes.filter(p =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get last consultation date for a patient
  const getLastConsultaDateStr = (pId) => {
    const pConsultas = consultas.filter(c => c.paciente_id === pId);
    if (pConsultas.length === 0) return 'Nenhuma';
    pConsultas.sort((a, b) => parseLocalDate(b.data_consulta) - parseLocalDate(a.data_consulta));
    const date = pConsultas[0].data_consulta;
    return date.split('-').reverse().join('/');
  };

  // ==========================================
  // Form submission: Create Paciente
  // ==========================================
  const handleRegisterPaciente = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newPacienteNome) {
      setError('O nome é obrigatório.');
      return;
    }

    try {
      // Append custom fields if typed
      const objetivos = [...selectedObjetivos];
      const patologias = [...selectedPatologias];
      if (newPacientePatologiaCustom.trim() && !patologias.includes(newPacientePatologiaCustom.trim())) {
        patologias.push(newPacientePatologiaCustom.trim());
      }
      const restricoes = [...selectedRestricoes];
      if (newPacienteRestricaoCustom.trim() && !restricoes.includes(newPacienteRestricaoCustom.trim())) {
        restricoes.push(newPacienteRestricaoCustom.trim());
      }
      const alergias = [...selectedAlergias];
      if (newPacienteAlergiaCustom.trim() && !alergias.includes(newPacienteAlergiaCustom.trim())) {
        alergias.push(newPacienteAlergiaCustom.trim());
      }

      const pData = {
        nutricionista_id: session.user.id,
        nome: newPacienteNome,
        email: newPacienteEmail || null,
        telefone: newPacienteTelefone || null,
        whatsapp: newPacienteWhatsapp || null,
        data_nascimento: newPacienteNascimento || null,
        sexo: newPacienteSexo,
        peso_inicial: newPacientePeso ? parseFloat(newPacientePeso) : null,
        altura: newPacienteAltura ? parseFloat(newPacienteAltura) : null,
        objetivos,
        objetivo_texto: newPacienteObjetivoTexto || null,
        nivel_atividade: newPacienteNivelAtividade,
        patologias,
        restricoes_alimentares: restricoes,
        alergias,
        medicamentos: newPacienteMedicamentos || null,
        suplementos: newPacienteSuplementos || null,
        refeicoes_por_dia: newPacienteRefeicoes ? parseInt(newPacienteRefeicoes) : null,
        horario_acorda: newPacienteHorarioAcorda || null,
        horario_dorme: newPacienteHorarioDorme || null,
        litros_agua: newPacienteAgua ? parseFloat(newPacienteAgua) : null,
        atividade_fisica: newPacienteAtividadeFisica === 'Sim',
        atividade_fisica_descricao: newPacienteAtividadeFisica === 'Sim' ? newPacienteAtividadeFisicaDesc : null,
        observacoes: newPacienteObs || null
      };

      const result = await createPaciente(pData);
      
      // PostgREST return=representation returns an array or single object
      const createdPaciente = Array.isArray(result) ? result[0] : result;

      // Clear Form states
      setNewPacienteNome('');
      setNewPacienteNascimento('');
      setNewPacienteSexo('Feminino');
      setNewPacienteTelefone('');
      setNewPacienteWhatsapp('');
      setNewPacienteEmail('');
      setNewPacientePeso('');
      setNewPacienteAltura('');
      setSelectedObjetivos([]);
      setNewPacienteObjetivoTexto('');
      setNewPacienteNivelAtividade('Sedentário');
      setSelectedPatologias([]);
      setNewPacientePatologiaCustom('');
      setSelectedRestricoes([]);
      setNewPacienteRestricaoCustom('');
      setSelectedAlergias([]);
      setNewPacienteAlergiaCustom('');
      setNewPacienteMedicamentos('');
      setNewPacienteSuplementos('');
      setNewPacienteRefeicoes('');
      setNewPacienteHorarioAcorda('');
      setNewPacienteHorarioDorme('');
      setNewPacienteAgua('');
      setNewPacienteAtividadeFisica('Não');
      setNewPacienteAtividadeFisicaDesc('');
      setNewPacienteObs('');
      setFormTab('pessoal');

      // Reload list and switch to profile view of the created patient
      await loadData();
      
      setSuccessMessage('Paciente cadastrado com sucesso!');
      if (createdPaciente && createdPaciente.id) {
        setSelectedPacienteId(createdPaciente.id);
        setActiveTab('paciente-perfil');
      } else {
        setActiveTab('pacientes');
      }
      
      // Auto clear success message after 4s
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      setError(`Erro ao salvar paciente no banco: ${err.message || err}`);
    }
  };

  // ==========================================
  // Form submission: Create Consulta
  // ==========================================
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
      setSuccessMessage('Consulta registrada com sucesso!');
      setTimeout(() => setSuccessMessage(''), 4000);
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
            onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); setSelectedPacienteId(null); }} 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <span className="nav-icon">📊</span> Dashboard
          </a>
          <a 
            href="#pacientes"
            onClick={(e) => { e.preventDefault(); setActiveTab('pacientes'); setSelectedPacienteId(null); }} 
            className={`nav-item ${activeTab === 'pacientes' || activeTab === 'paciente-cadastro' || activeTab === 'paciente-perfil' ? 'active' : ''}`}
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
            {successMessage && <div className="toast-success">{successMessage}</div>}

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
                  <div className="card stat-card">
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

            {/* TAB: LISTAGEM DE PACIENTES */}
            {activeTab === 'pacientes' && (
              <div className="form-card">
                <div className="section-header">
                  <h2>Pacientes</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('paciente-cadastro')}>
                    + Novo Paciente
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Buscar paciente por nome..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                {filteredPacientes.length === 0 ? (
                  <div className="empty-state card">
                    <p>{pacientes.length === 0 ? 'Nenhum paciente cadastrado ainda.' : 'Nenhum paciente encontrado com este nome.'}</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Objetivo</th>
                          <th>Última Consulta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPacientes.map(p => {
                          const fullObjectives = [...p.objetivos];
                          if (p.objetivo_texto) fullObjectives.push(p.objetivo_texto);
                          const objectivesStr = fullObjectives.length > 0 ? fullObjectives.join(', ') : '-';

                          return (
                            <tr key={p.id} onClick={() => viewPacienteProfile(p.id)}>
                              <td className="patient-row-name">{p.nome}</td>
                              <td>{objectivesStr}</td>
                              <td>{getLastConsultaDateStr(p.id)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: FORMULÁRIO DE CADASTRO (3 ABAS) */}
            {activeTab === 'paciente-cadastro' && (
              <div className="card form-card">
                <button className="btn-back" onClick={() => setActiveTab('pacientes')}>
                  ← Voltar para listagem
                </button>
                <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-bordeaux-dark)', marginBottom: '24px' }}>
                  Cadastrar Novo Paciente
                </h2>

                {/* Form Tabs Control */}
                <div className="form-tabs">
                  <button 
                    type="button" 
                    className={`form-tab-btn ${formTab === 'pessoal' ? 'active' : ''}`}
                    onClick={() => setFormTab('pessoal')}
                  >
                    Pessoal
                  </button>
                  <button 
                    type="button" 
                    className={`form-tab-btn ${formTab === 'clinico' ? 'active' : ''}`}
                    onClick={() => setFormTab('clinico')}
                  >
                    Clínico
                  </button>
                  <button 
                    type="button" 
                    className={`form-tab-btn ${formTab === 'habitos' ? 'active' : ''}`}
                    onClick={() => setFormTab('habitos')}
                  >
                    Hábitos
                  </button>
                </div>

                <form onSubmit={handleRegisterPaciente}>
                  {/* ABA 1: PESSOAL */}
                  {formTab === 'pessoal' && (
                    <div>
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
                          <label>Data de Nascimento</label>
                          <input 
                            type="date" 
                            value={newPacienteNascimento} 
                            onChange={e => setNewPacienteNascimento(e.target.value)} 
                          />
                          {newPacienteNascimento && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-green)', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                              Idade calculada: {calculateAge(newPacienteNascimento)} anos
                            </span>
                          )}
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
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Telefone</label>
                          <input 
                            type="text" 
                            placeholder="(00) 0000-0000"
                            value={newPacienteTelefone} 
                            onChange={e => setNewPacienteTelefone(formatPhone(e.target.value))} 
                          />
                        </div>
                        <div className="form-group">
                          <label>WhatsApp</label>
                          <input 
                            type="text" 
                            placeholder="(00) 00000-0000"
                            value={newPacienteWhatsapp} 
                            onChange={e => setNewPacienteWhatsapp(formatPhone(e.target.value))} 
                          />
                        </div>
                        <div className="form-group">
                          <label>E-mail</label>
                          <input 
                            type="email" 
                            placeholder="exemplo@email.com"
                            value={newPacienteEmail} 
                            onChange={e => setNewPacienteEmail(e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => setActiveTab('pacientes')}>
                          Cancelar
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => setFormTab('clinico')}>
                          Avançar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ABA 2: CLÍNICO */}
                  {formTab === 'clinico' && (
                    <div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Peso Atual</label>
                          <div className="input-with-unit">
                            <input 
                              type="number" 
                              step="0.1" 
                              placeholder="0.0"
                              value={newPacientePeso} 
                              onChange={e => setNewPacientePeso(e.target.value)} 
                            />
                            <span className="input-unit-label">kg</span>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Altura</label>
                          <div className="input-with-unit">
                            <input 
                              type="number" 
                              placeholder="0"
                              value={newPacienteAltura} 
                              onChange={e => setNewPacienteAltura(e.target.value)} 
                            />
                            <span className="input-unit-label">cm</span>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>IMC (Cálculo Automático)</label>
                          <input 
                            type="text" 
                            className="readonly-field"
                            value={getIMC()} 
                            readOnly 
                            placeholder="Preencha peso e altura"
                          />
                        </div>
                      </div>

                      {/* Objetivos */}
                      <div className="form-group">
                        <label>Objetivo</label>
                        <div className="checkbox-grid">
                          {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => (
                            <label key={obj} className="checkbox-item">
                              <input 
                                type="checkbox" 
                                checked={selectedObjetivos.includes(obj)}
                                onChange={() => {
                                  if (selectedObjetivos.includes(obj)) {
                                    setSelectedObjetivos(selectedObjetivos.filter(x => x !== obj));
                                  } else {
                                    setSelectedObjetivos([...selectedObjetivos, obj]);
                                  }
                                }}
                              />
                              {obj}
                            </label>
                          ))}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Outros objetivos livremente..."
                          className="custom-input-inline"
                          value={newPacienteObjetivoTexto}
                          onChange={e => setNewPacienteObjetivoTexto(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Nível de Atividade Física</label>
                        <select 
                          value={newPacienteNivelAtividade} 
                          onChange={e => setNewPacienteNivelAtividade(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: '1.5px solid var(--color-border)',
                            borderRadius: 'var(--border-radius-md)',
                            backgroundColor: 'var(--color-bg-base)',
                            fontSize: '1rem',
                            marginBottom: '16px'
                          }}
                        >
                          <option value="Sedentário">Sedentário</option>
                          <option value="Levemente ativo">Levemente ativo</option>
                          <option value="Moderadamente ativo">Moderadamente ativo</option>
                          <option value="Muito ativo">Muito ativo</option>
                          <option value="Extremamente ativo">Extremamente ativo</option>
                        </select>
                      </div>

                      {/* Patologias */}
                      <div className="form-group">
                        <label>Patologias ou condições de saúde</label>
                        <div className="checkbox-grid">
                          <label className="checkbox-item">
                            <input 
                              type="checkbox" 
                              checked={selectedPatologias.includes('Nenhum')}
                              onChange={() => handleCheckboxChange('Nenhum', selectedPatologias, setSelectedPatologias, true)}
                            />
                            <strong>Nenhuma</strong>
                          </label>
                          {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map(pat => (
                            <label key={pat} className="checkbox-item">
                              <input 
                                type="checkbox" 
                                checked={selectedPatologias.includes(pat)}
                                onChange={() => handleCheckboxChange(pat, selectedPatologias, setSelectedPatologias)}
                              />
                              {pat}
                            </label>
                          ))}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Adicionar outra patologia..."
                          className="custom-input-inline"
                          value={newPacientePatologiaCustom}
                          onChange={e => setNewPacientePatologiaCustom(e.target.value)}
                        />
                      </div>

                      {/* Restrições Alimentares */}
                      <div className="form-group">
                        <label>Restrições Alimentares</label>
                        <div className="checkbox-grid">
                          <label className="checkbox-item">
                            <input 
                              type="checkbox" 
                              checked={selectedRestricoes.includes('Nenhum')}
                              onChange={() => handleCheckboxChange('Nenhum', selectedRestricoes, setSelectedRestricoes, true)}
                            />
                            <strong>Nenhuma</strong>
                          </label>
                          {['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'].map(res => (
                            <label key={res} className="checkbox-item">
                              <input 
                                type="checkbox" 
                                checked={selectedRestricoes.includes(res)}
                                onChange={() => handleCheckboxChange(res, selectedRestricoes, setSelectedRestricoes)}
                              />
                              {res}
                            </label>
                          ))}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Adicionar outra restrição..."
                          className="custom-input-inline"
                          value={newPacienteRestricaoCustom}
                          onChange={e => setNewPacienteRestricaoCustom(e.target.value)}
                        />
                      </div>

                      {/* Alergias Alimentares */}
                      <div className="form-group">
                        <label>Alergias Alimentares</label>
                        <div className="checkbox-grid">
                          <label className="checkbox-item">
                            <input 
                              type="checkbox" 
                              checked={selectedAlergias.includes('Nenhum')}
                              onChange={() => handleCheckboxChange('Nenhum', selectedAlergias, setSelectedAlergias, true)}
                            />
                            <strong>Nenhuma</strong>
                          </label>
                          {['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'].map(ale => (
                            <label key={ale} className="checkbox-item">
                              <input 
                                type="checkbox" 
                                checked={selectedAlergias.includes(ale)}
                                onChange={() => handleCheckboxChange(ale, selectedAlergias, setSelectedAlergias)}
                              />
                              {ale}
                            </label>
                          ))}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Adicionar outra alergia..."
                          className="custom-input-inline"
                          value={newPacienteAlergiaCustom}
                          onChange={e => setNewPacienteAlergiaCustom(e.target.value)}
                        />
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Medicamentos contínuos</label>
                          <textarea 
                            rows="2" 
                            style={{ width: '100%', padding: '12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-md)' }}
                            value={newPacienteMedicamentos}
                            onChange={e => setNewPacienteMedicamentos(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Suplementos em uso</label>
                          <textarea 
                            rows="2" 
                            style={{ width: '100%', padding: '12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-md)' }}
                            value={newPacienteSuplementos}
                            onChange={e => setNewPacienteSuplementos(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => setFormTab('pessoal')}>
                          Voltar
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => setFormTab('habitos')}>
                          Avançar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ABA 3: HÁBITOS */}
                  {formTab === 'habitos' && (
                    <div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Refeições por dia</label>
                          <input 
                            type="number" 
                            placeholder="Quantidade"
                            value={newPacienteRefeicoes} 
                            onChange={e => setNewPacienteRefeicoes(e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label>Horário que acorda</label>
                          <input 
                            type="text" 
                            placeholder="Ex: 6 ou 630"
                            value={newPacienteHorarioAcorda} 
                            onChange={e => setNewPacienteHorarioAcorda(e.target.value)} 
                            onBlur={() => handleTimeBlur(newPacienteHorarioAcorda, setNewPacienteHorarioAcorda)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Horário que dorme</label>
                          <input 
                            type="text" 
                            placeholder="Ex: 23 ou 2230"
                            value={newPacienteHorarioDorme} 
                            onChange={e => setNewPacienteHorarioDorme(e.target.value)} 
                            onBlur={() => handleTimeBlur(newPacienteHorarioDorme, setNewPacienteHorarioDorme)}
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Quantidade de água por dia</label>
                          <div className="input-with-unit">
                            <input 
                              type="number" 
                              step="0.1" 
                              placeholder="0.0"
                              value={newPacienteAgua} 
                              onChange={e => setNewPacienteAgua(e.target.value)} 
                            />
                            <span className="input-unit-label">litros</span>
                          </div>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label style={{ marginBottom: '8px', display: 'block' }}>Pratica atividade física?</label>
                          <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                            <label className="checkbox-item">
                              <input 
                                type="radio" 
                                name="atividadeFisica"
                                checked={newPacienteAtividadeFisica === 'Sim'}
                                onChange={() => setNewPacienteAtividadeFisica('Sim')}
                              />
                              Sim
                            </label>
                            <label className="checkbox-item">
                              <input 
                                type="radio" 
                                name="atividadeFisica"
                                checked={newPacienteAtividadeFisica === 'Não'}
                                onChange={() => {
                                  setNewPacienteAtividadeFisica('Não');
                                  setNewPacienteAtividadeFisicaDesc('');
                                }}
                              />
                              Não
                            </label>
                          </div>
                          
                          {newPacienteAtividadeFisica === 'Sim' && (
                            <div style={{ marginTop: '12px' }}>
                              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Qual atividade e frequência semanal?</label>
                              <input 
                                type="text"
                                className="custom-input-inline"
                                placeholder="Ex: Musculação, 4x por semana"
                                value={newPacienteAtividadeFisicaDesc}
                                onChange={e => setNewPacienteAtividadeFisicaDesc(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Observações Gerais</label>
                        <textarea 
                          rows="4" 
                          style={{ width: '100%', padding: '12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-md)' }}
                          value={newPacienteObs}
                          onChange={e => setNewPacienteObs(e.target.value)}
                        />
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => setFormTab('clinico')}>
                          Voltar
                        </button>
                        <button type="submit" className="btn btn-primary">
                          Salvar Paciente
                        </button>
                      </div>
                    </div>
                  )}
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
                  {/* Left Column: Personal info & Clinical & Habits summaries */}
                  <div>
                    {/* Pessoal */}
                    <div className="profile-card" style={{ marginBottom: '24px' }}>
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
                          <span className="profile-info-label">Telefone</span>
                          <p className="profile-info-value">{selectedPaciente.telefone || '-'}</p>
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
                          <p className="profile-info-value">
                            {selectedPaciente.data_nascimento 
                              ? `${selectedPaciente.data_nascimento.split('-').reverse().join('/')} (${calculateAge(selectedPaciente.data_nascimento)} anos)` 
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Clínico */}
                    <div className="profile-card" style={{ marginBottom: '24px' }}>
                      <h4 className="profile-section-title" style={{ marginTop: 0 }}>Dados Clínicos</h4>
                      <div className="profile-info-list">
                        <div className="profile-info-item">
                          <span className="profile-info-label">Peso Inicial</span>
                          <p className="profile-info-value">{selectedPaciente.peso_inicial ? `${selectedPaciente.peso_inicial} kg` : '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Altura</span>
                          <p className="profile-info-value">{selectedPaciente.altura ? `${selectedPaciente.altura} cm` : '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">IMC Inicial</span>
                          <p className="profile-info-value">
                            {selectedPaciente.peso_inicial && selectedPaciente.altura 
                              ? (selectedPaciente.peso_inicial / Math.pow(selectedPaciente.altura / 100, 2)).toFixed(1) 
                              : '-'}
                          </p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Objetivo</span>
                          <p className="profile-info-value">
                            {[...selectedPaciente.objetivos, selectedPaciente.objetivo_texto].filter(Boolean).join(', ') || '-'}
                          </p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Nível de Atividade</span>
                          <p className="profile-info-value">{selectedPaciente.nivel_atividade || '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Patologias</span>
                          <p className="profile-info-value">{selectedPaciente.patologias?.join(', ') || '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Restrições Alimentares</span>
                          <p className="profile-info-value">{selectedPaciente.restricoes_alimentares?.join(', ') || '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Alergias</span>
                          <p className="profile-info-value">{selectedPaciente.alergias?.join(', ') || '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Medicamentos Contínuos</span>
                          <p className="profile-info-value">{selectedPaciente.medicamentos || '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Suplementos em uso</span>
                          <p className="profile-info-value">{selectedPaciente.suplementos || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Hábitos */}
                    <div className="profile-card">
                      <h4 className="profile-section-title" style={{ marginTop: 0 }}>Rotina & Hábitos</h4>
                      <div className="profile-info-list">
                        <div className="profile-info-item">
                          <span className="profile-info-label">Refeições por dia</span>
                          <p className="profile-info-value">{selectedPaciente.refeicoes_por_dia || '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Horário Acorda / Dorme</span>
                          <p className="profile-info-value">
                            {selectedPaciente.horario_acorda || selectedPaciente.horario_dorme
                              ? `${selectedPaciente.horario_acorda || '-'} às ${selectedPaciente.horario_dorme || '-'}` 
                              : '-'}
                          </p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Água por dia</span>
                          <p className="profile-info-value">{selectedPaciente.litros_agua ? `${selectedPaciente.litros_agua} litros` : '-'}</p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Exercício Físico</span>
                          <p className="profile-info-value">
                            {selectedPaciente.atividade_fisica 
                              ? `Sim (${selectedPaciente.atividade_fisica_descricao || 'Sem descrição'})`
                              : 'Não'}
                          </p>
                        </div>
                        <div className="profile-info-item">
                          <span className="profile-info-label">Observações Gerais</span>
                          <p className="profile-info-value" style={{ whiteSpace: 'pre-line' }}>{selectedPaciente.observacoes || '-'}</p>
                        </div>
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
