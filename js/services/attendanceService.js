import API from '../api.js';

const AttendanceService = {
    getToday: async () => {
        return await API.get('/ChamCong/MyToday');
    },

    checkIn: async (viTri) => {
        return await API.post('/ChamCong/CheckIn', { viTri });
    },

    checkOut: async (viTri) => {
        return await API.post('/ChamCong/CheckOut', { viTri });
    }
};

export default AttendanceService;
