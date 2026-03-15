// API client for Mission Control v2
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Tasks API
export const tasksAPI = {
  list: () => fetchAPI('/api/tasks'),
  getByStatus: (status: string) => fetchAPI(`/api/tasks?status=${status}`),
  create: (data: any) => fetchAPI('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchAPI(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchAPI(`/api/tasks/${id}`, { method: 'DELETE' }),
};

// Sessions API
export const sessionsAPI = {
  list: () => fetchAPI('/api/sessions'),
  get: (id: string) => fetchAPI(`/api/sessions/${id}`),
};

// Projects API
export const projectsAPI = {
  list: () => fetchAPI('/api/projects'),
  create: (data: any) => fetchAPI('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
};

// Activity API
export const activityAPI = {
  list: (limit?: number) => fetchAPI(`/api/activity?limit=${limit || 50}`),
};

// Health check
export const healthAPI = {
  check: () => fetchAPI('/api/health'),
};
