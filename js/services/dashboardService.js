import API from '../api.js';

class DashboardService {
    static async getDashboard() {
        return await API.get('/ThongKe/dashboard');
    }
}

export default DashboardService;


