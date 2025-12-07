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

    static async importExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const headers = API.getHeaders();
        // Remove Content-Type to let browser set it with boundary for FormData
        delete headers['Content-Type'];
        
        try {
            const response = await fetch(`${API.BASE_URL}/BangLuong/import-excel`, {
                method: 'POST',
                headers,
                body: formData
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Unexpected response: ${text}`);
            }
            
            // Handle 404 specifically
            if (response.status === 404) {
                throw new Error('Endpoint không tồn tại. Vui lòng kiểm tra lại backend đã được restart chưa.');
            }
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: Không thể import Excel`);
            }
            
            return data;
        } catch (error) {
            console.error('Import Excel Error:', error);
            throw error;
        }
    }
}

export default SalaryService;
