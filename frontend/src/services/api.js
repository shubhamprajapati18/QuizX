const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get auth header
const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('quizx_faculty_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Generic request helper
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const defaultOptions = {
    headers: getHeaders(isFormData)
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const res = await fetch(url, finalOptions);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Server request failed');
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth API
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getProfile: () => request('/auth/profile', { method: 'GET' }),
    updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) })
  },

  // Faculty Quizzes API
  quizzes: {
    getDashboardStats: () => request('/quizzes/dashboard-stats'),
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/quizzes${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/quizzes/${id}`),
    getByCodePublic: (quizCode) => request(`/quizzes/public/code/${quizCode}`),
    create: (quizData) => request('/quizzes', { method: 'POST', body: JSON.stringify(quizData) }),
    update: (id, quizData) => request(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(quizData) }),
    duplicate: (id) => request(`/quizzes/${id}/duplicate`, { method: 'POST' }),
    togglePublish: (id, statusData) => request(`/quizzes/${id}/publish`, { method: 'PATCH', body: JSON.stringify(statusData) }),
    delete: (id) => request(`/quizzes/${id}`, { method: 'DELETE' })
  },

  // Document Import API
  import: {
    uploadDocument: (formData) => request('/import/upload', { method: 'POST', body: formData })
  },

  // Student Attempts API
  attempts: {
    start: (attemptData) => request('/attempts/start', { method: 'POST', body: JSON.stringify(attemptData) }),
    getActive: (attemptId) => request(`/attempts/${attemptId}/active`),
    saveResponse: (attemptId, responseData) => request(`/attempts/${attemptId}/save-response`, { method: 'POST', body: JSON.stringify(responseData) }),
    syncBatch: (attemptId, batchData) => request(`/attempts/${attemptId}/sync-batch`, { method: 'POST', body: JSON.stringify(batchData) }),
    submit: (attemptId) => request(`/attempts/${attemptId}/submit`, { method: 'POST' }),
    getResult: (attemptId) => request(`/attempts/${attemptId}/result`)
  },

  // Faculty Results & Analytics API
  results: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/results${query ? `?${query}` : ''}`);
    },
    getSubmissionDetail: (attemptId) => request(`/results/submission/${attemptId}`),
    getAnalytics: (quizId) => request(`/results/analytics/${quizId}`)
  }
};
