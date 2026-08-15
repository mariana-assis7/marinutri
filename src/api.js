import { authClient } from './auth';

const DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL || 'https://ep-icy-pond-ac0gshlr.apirest.sa-east-1.aws.neon.tech/neondb/rest/v1';

async function getAuthHeaders() {
  try {
    const { data, error } = await authClient.token();
    if (error) {
      console.error('Erro ao obter token do Neon Auth:', error);
      throw new Error(`Erro do Neon Auth: ${error.message || JSON.stringify(error)}`);
    }
    const token = data?.session?.token || data?.token;
    if (!token) {
      throw new Error(`Token não retornado pelo Neon Auth (data=${JSON.stringify(data)})`);
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (e) {
    console.error('Erro em getAuthHeaders:', e);
    throw new Error(`Falha na autenticação do token: ${e.message}`);
  }
}

export async function fetchPacientes() {
  const headers = await getAuthHeaders();
  const url = `${DATA_API_URL}/pacientes`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${errText}`);
    }
    return response.json();
  } catch (e) {
    throw new Error(`Fetch falhou para ${url}: ${e.message}`);
  }
}

export async function fetchConsultas() {
  const headers = await getAuthHeaders();
  const url = `${DATA_API_URL}/consultas`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${errText}`);
    }
    return response.json();
  } catch (e) {
    throw new Error(`Fetch falhou para ${url}: ${e.message}`);
  }
}

export async function createPaciente(paciente) {
  const headers = await getAuthHeaders();
  const url = `${DATA_API_URL}/pacientes`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(paciente),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${errText}`);
    }
    return response.json();
  } catch (e) {
    throw new Error(`Post falhou para ${url}: ${e.message}`);
  }
}

export async function updatePaciente(id, paciente) {
  const headers = await getAuthHeaders();
  const url = `${DATA_API_URL}/pacientes?id=eq.${id}`;
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(paciente),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${errText}`);
    }
    return response.json();
  } catch (e) {
    throw new Error(`Patch falhou para ${url}: ${e.message}`);
  }
}


export async function createConsulta(consulta) {
  const headers = await getAuthHeaders();
  const url = `${DATA_API_URL}/consultas`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(consulta),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${errText}`);
    }
    return response.json();
  } catch (e) {
    throw new Error(`Post falhou para ${url}: ${e.message}`);
  }
}
