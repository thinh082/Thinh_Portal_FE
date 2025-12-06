import API from '../api.js';

class DepartmentService {
    static async getAll() {
        return await API.get('/PhongBan/get-list');
    }

    static async create(data) {
        return await API.post('/PhongBan/add', data);
    }

    static async update(data) {
        return await API.post('/PhongBan/update', data);
    }

    static async delete(id) {
        return await API.post(`/PhongBan/delete?id=${id}`);
    }

    static async getById(id) {
        return await API.get(`/PhongBan/get-by-id?id=${id}`);
    }
}

export default DepartmentService;
