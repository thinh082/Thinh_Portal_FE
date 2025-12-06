import API from '../api.js';

class OvertimeService {
    static async getMyOt() {
        return await API.get('/TangCa/get-my-ot');
    }

    static async requestOt(data) {
        return await API.post('/TangCa/request-ot', data);
    }

    static async getAllOt() {
        return await API.get('/TangCa/get-all-ot');
    }
}

export default OvertimeService;


