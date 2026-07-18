const API_URL = '/api';

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = { ...options.headers };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  if (options.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  } else {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, name: string, password: string) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) }),
  me: () => request<any>('/auth/me'),
};

export const projects = {
  list: () => request<any[]>('/projects'),
  get: (id: string) => request<any>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string }) =>
    request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (id: string, email: string, role: string = 'viewer') =>
    request<any>(`/projects/${id}/members/${email}`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  removeMember: (id: string, userId: string) =>
    request<any>(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
};

export const files = {
  list: (projectId: string) => request<any[]>(`/files/${projectId}`),
  get: (projectId: string, fileId: string) => request<any>(`/files/${projectId}/${fileId}`),
  upload: (projectId: string, formData: FormData) =>
    request<any>(`/files/upload/${projectId}`, { method: 'POST', body: formData }),
  delete: (projectId: string, fileId: string) =>
    request<any>(`/files/${projectId}/${fileId}`, { method: 'DELETE' }),
};

export const comments = {
  list: (fileId: string) => request<any[]>(`/comments/file/${fileId}`),
  create: (fileId: string, data: { content: string; timecode?: number; parent_id?: string }) =>
    request<any>(`/comments/file/${fileId}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, content: string) =>
    request<any>(`/comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
  delete: (id: string) => request<any>(`/comments/${id}`, { method: 'DELETE' }),
  resolve: (id: string) => request<any>(`/comments/${id}/resolve`, { method: 'POST' }),
};

export const annotations = {
  list: (fileId: string, timecode?: number) =>
    request<any[]>(`/annotations/file/${fileId}${timecode !== undefined ? `?timecode=${timecode}` : ''}`),
  create: (fileId: string, data: { timecode: number; type: string; data: any; color?: string; stroke_width?: number }) =>
    request<any>(`/annotations/file/${fileId}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { data?: any; color?: string; stroke_width?: number }) =>
    request<any>(`/annotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/annotations/${id}`, { method: 'DELETE' }),
};

export const reviews = {
  list: (fileId: string) => request<any[]>(`/reviews/file/${fileId}`),
  create: (fileId: string) => request<any>(`/reviews/file/${fileId}`, { method: 'POST' }),
  update: (id: string, decision: string, feedback?: string) =>
    request<any>(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ decision, feedback }) }),
};
