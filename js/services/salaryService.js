import API from '../api.js';

class SalaryService {
    static async getMySalary() {
        return await API.get('/BangLuong/my-salary');
    }

    // Admin/HR function to calculate salary
    static async calculate(month, year) {
        return await API.post('/BangLuong/calculate', { thang: month, nam: year });
    }

    static async getAllSalary() {
        return await API.get('/BangLuong/get-all-salary');
    }

    static async exportAllExcel(thang, nam) {
        const params = [];
        if (thang) params.push(`thang=${thang}`);
        if (nam) params.push(`nam=${nam}`);
        const qs = params.length ? `?${params.join('&')}` : '';
        const headers = API.getHeaders();
        // remove content-type to allow blob
        delete headers['Content-Type'];
        const response = await fetch(`${API.BASE_URL}/BangLuong/export-excel${qs}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Không thể xuất Excel');
        return await response.blob();
    }

    static async exportMyPdf(thang, nam) {
        const params = [];
        if (thang) params.push(`thang=${thang}`);
        if (nam) params.push(`nam=${nam}`);
        const qs = params.length ? `?${params.join('&')}` : '';
        const headers = API.getHeaders();
        delete headers['Content-Type'];
        const response = await fetch(`${API.BASE_URL}/BangLuong/export-pdf${qs}`, {
            method: 'GET',
            headers
        });
        if (!response.ok) throw new Error('Không thể xuất PDF');
        return await response.blob();
    }
}

export default SalaryService;
