
import API from '../api.js';

class LeaveService {
    static async getAll() {
        return await API.get('/NghiPhep/get-list');
    }

    static async create(data) {
        return await API.post('/NghiPhep/create-request', data);
    }

    static async update(data) {
        return await API.post('/NghiPhep/update-request', data);
    }

    static async delete(id) {
        return await API.post(`/NghiPhep/delete-request?id=${id}`);
    }

    static async approveReject(data) {
        return await API.post('/NghiPhep/approve-reject', data);
    }

    static async getById(id) {
        return await API.get(`/NghiPhep/get-by-id?id=${id}`);
    }

    static async getMyLeaveRequests() {
        return await API.get('/NghiPhep/get-request-employee');
    }
}

export default LeaveService;
