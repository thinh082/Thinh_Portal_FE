import API from '../api.js';

class TaskService {
    static async getMyTasks() {
        return await API.get('/CongViec/get-my-tasks');
    }

    static async assignTask(data) {
        return await API.post('/CongViec/assign-task', data);
    }

    static async updateStatus(id, status, note) {
        return await API.post('/CongViec/update-status', { id: id, trangThai: status, ghiChu: note });
    }

    static async getAllTasks() {
        return await API.get('/CongViec/get-all-tasks');
    }
}

export default TaskService;
