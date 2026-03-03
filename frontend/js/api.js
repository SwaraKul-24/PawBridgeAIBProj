const API_BASE_URL = 'http://localhost:3000/api';

async function postForm(endpoint, formData) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
