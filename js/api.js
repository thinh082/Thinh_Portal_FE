import { showToast } from './utils.js';

class API {
    static BASE_URL = 'http://localhost:5111/api';

    static getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    static async handleResponse(response) {
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // If no JSON, but status is 401, handle it
            if (response.status === 401) {
                window.location.href = 'index.html';
                throw new Error('Unauthorized');
            }
            if (!response.ok) {
                const msg = response.statusText || 'Unknown Error';
                showToast(msg, 'danger');
                throw new Error(msg);
            }
            return null;
        }

        // Handle HTTP 401 Unauthorized
        if (response.status === 401) {
            // Case A: Not logged in
            if (data.message && data.message.includes("Chưa đăng nhập")) {
                window.location.href = 'index.html';
                throw new Error('Unauthorized');
            }
            // Case B: Permission denied or other 401s
            showToast(data.message || 'Unauthorized', 'warning');
            throw new Error(data.message || 'Unauthorized');
        }

        // Handle Backend Custom Status Codes (wrapped in 200 OK)
        if (data.statusCode && data.statusCode !== 200) {
            if (data.statusCode === 401) {
                if (data.message && data.message.includes("Chưa đăng nhập")) {
                    window.location.href = 'index.html';
                } else {
                    showToast(data.message || 'Unauthorized', 'warning');
                }
            } else if (data.statusCode === 403) {
                showToast(data.message || 'Forbidden', 'warning');
            } else {
                showToast(data.message || `Error ${data.statusCode}`, 'danger');
            }
            throw new Error(data.message || `Error ${data.statusCode}`);
        }

        // Handle other HTTP errors if backend didn't return custom structure
        if (!response.ok) {
            showToast(data.message || 'Something went wrong', 'danger');
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    }

    static async get(endpoint) {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    }

    static async post(endpoint, data) {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    }
}

export default API;
