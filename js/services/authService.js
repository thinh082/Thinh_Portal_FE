import API from '../api.js';

const AuthService = {
    async login(username, password) {
        try {
            const response = await API.post('/Auth/login', {
                TenDangNhap: username,
                MatKhau: password
            });

            // The backend returns a flat object with token and user info
            if (response.token) {
                localStorage.setItem('token', response.token);

                const user = {
                    id: response.idTaiKhoan,
                    username: username,
                    role: response.role,
                    roleId: response.roleId
                };
                localStorage.setItem('user', JSON.stringify(user));

                return response;
            } else {
                // This case should ideally be handled by API.handleResponse if statusCode != 200
                // But just in case
                return response;
            }
        } catch (error) {
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};

export default AuthService;
