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
  list: (params?: { filter?: 'all' | 'active' | 'recent24h' | 'recent7d' | 'recent30d', search?: string, model?: string, limit?: number, offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.filter) query.append('filter', params.filter);
    if (params?.search) query.append('search', params.search);
    if (params?.model) query.append('model', params.model);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return fetchAPI(`/api/sessions?${query.toString()}`);
  },
  get: (id: string) => fetchAPI(`/api/sessions/${id}`),
  getMessages: (id: string, params?: { limit?: number, offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return fetchAPI(`/api/sessions/${id}/messages?${query.toString()}`);
  },
  getModels: () => fetchAPI('/api/sessions/models/list'),
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

// Memories API
export const memoriesAPI = {
  list: (params?: { date_from?: string; date_to?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', params.limit.toString());
    return fetchAPI(`/api/memories?${query.toString()}`);
  },
  getByDate: (date: string) => fetchAPI(`/api/memories/${date}`),
};

// Documents API
export const documentsAPI = {
  list: (params?: { category?: string; search?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    return fetchAPI(`/api/documents?${query.toString()}`);
  },
  getCategories: () => fetchAPI('/api/documents/categories'),
  getContent: (path: string) => fetchAPI(`/api/documents/content/${path}`),
};

// BTG Queue API
export const btgQueueAPI = {
  list: (params?: { status?: 'active' | 'resolved' | 'archived' | 'pending'; filter?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.filter) query.append('filter', params.filter);
    return fetchAPI(`/api/btg-queue?${query.toString()}`);
  },
  getStats: () => fetchAPI('/api/btg-queue/stats'),
};

// Calendar API
export const calendarAPI = {
  list: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    return fetchAPI(`/api/calendar?${query.toString()}`);
  },
  getEvents: (start?: string, end?: string) => {
    const query = new URLSearchParams();
    if (start) query.append('start', start);
    if (end) query.append('end', end);
    return fetchAPI(`/api/calendar/events?${query.toString()}`);
  },
};

// Health check
export const healthAPI = {
  check: () => fetchAPI('/api/health'),
};

// Subagents API
export const subagentsAPI = {
  list: (params?: { status?: string; model?: string; parent_session?: string; date_from?: string; date_to?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.model) query.append('model', params.model);
    if (params?.parent_session) query.append('parent_session', params.parent_session);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return fetchAPI(`/api/subagents?${query.toString()}`);
  },
  get: (id: string) => fetchAPI(`/api/subagents/${id}`),
  getStats: () => fetchAPI('/api/subagents/stats/overview'),
};