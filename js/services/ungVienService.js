import API from '../api.js';

class UngVienService {
    static async getList() {
        return await API.get('/UngVien/get-list');
    }

    static async getAll() {
        return await API.get('/UngVien/get-all');
    }

    static async update(data) {
        return await API.post('/UngVien/update-ung-vien', data);
    }

    static async getLichSuDanhGiaById(id) {
        return await API.get(`/UngVien/get-lich-su-danh-gia/${id}`);
    }
}

export default UngVienService;

