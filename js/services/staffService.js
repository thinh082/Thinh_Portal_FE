import API from '../api.js';

class StaffService {
    static async getAll() {
        return await API.get('/NhanVien/get-list');
    }

    static async getById(id) {
        return await API.get(`/NhanVien/${id}`);
    }

    static async create(data) {
        return await API.post('/NhanVien/add', data);
    }

    static async update(data) {
        return await API.post('/NhanVien/update', data);
    }

    static async delete(id) {
        return await API.post('/NhanVien/delete', { id: id });
    }

    static async addOT(data) {
        return await API.post('/NhanVien/add-ot', data);
    }
}

export default StaffService;
