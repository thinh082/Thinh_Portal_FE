import API from '../api.js';

class ProjectService {
    static async getAll() {
        return await API.get('/DuAn/get-list');
    }

    static async getById(id) {
        return await API.get(`/DuAn/${id}`);
    }

    static async create(data) {
        return await API.post('/DuAn/add', data);
    }

    static async update(data) {
        return await API.post('/DuAn/update', data);
    }

    static async delete(id) {
        return await API.post('/DuAn/delete', { Id: id });
    }
}

export default ProjectService;

