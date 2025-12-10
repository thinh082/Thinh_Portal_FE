import AuthService from './services/authService.js';
import StaffService from './services/staffService.js';
import DepartmentService from './services/departmentService.js';
import LeaveService from './services/leaveService.js';
import SalaryService from './services/salaryService.js';
import TaskService from './services/taskService.js';
import AttendanceService from './services/attendanceService.js';
import DashboardService from './services/dashboardService.js';
import OvertimeService from './services/overtimeService.js';
import ProjectService from './services/projectService.js';
import UngVienService from './services/ungVienService.js';
import { formatMoney, showToast, initDarkMode } from './utils.js';

// --- Global State & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Dark Mode
    initDarkMode();
    
    // 1. Check Auth
    if (!AuthService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Display User Info
    const user = AuthService.getCurrentUser();
    if (user) {
        const userInfoEl = document.getElementById('userInfo');
        if (userInfoEl) {
            userInfoEl.textContent = `${user.username}`;
        }
    }

    // 3. Setup Event Listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            AuthService.logout();
        });
    }

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarCollapse');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (event) => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
        });
    }

    // Navigation
    const navLinks = document.querySelectorAll('#sidebar .list-group-item');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // CRITICAL: Prevent default anchor behavior

            // Remove active class from all
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to clicked
            e.currentTarget.classList.add('active');

            const page = e.currentTarget.getAttribute('data-page');
            loadPage(page);
        });
    });

    // Profile Link
    const profileLink = document.getElementById('dropdown-profile');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage('profile');
        });
    }

    // Profile Save Button
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', handleUpdateProfile);
    }

    // Password Save Button
    const btnSavePassword = document.getElementById('btnSavePassword');
    if (btnSavePassword) {
        btnSavePassword.addEventListener('click', handlePasswordChange);
    }
}

// --- Page Loading Logic ---
function loadPage(page) {
    const contentArea = document.getElementById('content-area');
    const profileSection = document.getElementById('profile-section');

    if (!contentArea || !profileSection) return;

    // Handle Profile View
    if (page === 'profile') {
        contentArea.style.display = 'none';
        profileSection.style.display = 'block';
        loadProfile();
        return;
    }

    // Handle Standard Views
    contentArea.style.display = 'block';
    profileSection.style.display = 'none';
    contentArea.innerHTML = '';

    // Update Breadcrumb (Simple implementation)
    const pageTitle = page.charAt(0).toUpperCase() + page.slice(1);
    const breadcrumbHtml = `
        <div class="page-header">
            <h1 class="page-title">${page === 'dashboard' ? 'Dashboard' : pageTitle + ' Management'}</h1>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="#">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">${pageTitle}</li>
                </ol>
            </nav>
        </div>
    `;

    switch (page) {
        case 'staff':
            contentArea.innerHTML = breadcrumbHtml;
            loadStaffPage(contentArea);
            break;
        case 'dashboard':
            contentArea.innerHTML = breadcrumbHtml;
            loadDashboard(contentArea);
            break;
        case 'department':
            contentArea.innerHTML = breadcrumbHtml;
            loadDepartmentPage(contentArea);
            break;
        case 'leave':
            contentArea.innerHTML = breadcrumbHtml;
            loadLeavePage(contentArea);
            break;
        case 'salary':
            contentArea.innerHTML = breadcrumbHtml;
            loadSalaryPage(contentArea);
            break;
        case 'tasks':
            contentArea.innerHTML = breadcrumbHtml;
            loadTaskPage(contentArea);
            break;
        case 'overtime':
            contentArea.innerHTML = breadcrumbHtml;
            loadOvertimeAdminPage(contentArea);
            break;
        case 'project':
            contentArea.innerHTML = breadcrumbHtml;
            loadProjectPage(contentArea);
            break;
        case 'cv':
            contentArea.innerHTML = breadcrumbHtml;
            loadCvPage(contentArea);
            break;
        default:
            contentArea.innerHTML = '<h2>404</h2><p>Page not found.</p>';
    }
}

// ... (Existing Dashboard Logic, Staff Logic, etc.) ...

// --- Profile Logic ---
async function loadProfile() {
    const user = AuthService.getCurrentUser();
    if (!user) return;

    // Set Avatar & Basic Info
    document.getElementById('profileName').textContent = user.hoTen || user.username;
    document.getElementById('profileRole').textContent = user.role || 'Employee';
    document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen || user.username)}&background=0d6efd&color=fff&size=128`;

    try {
        // Fetch full details
        // Assuming user.id is available in the stored user object. 
        // If not, we might need an endpoint like /NhanVien/Me or similar.
        // For now, let's try using StaffService.getById if we have an ID.
        // If user object from login doesn't have ID, we might need to rely on what we have or fetch 'Me'.

        // Fallback: If we don't have an ID, we can't fetch details easily without a /Me endpoint.
        // Let's assume user.id exists.
        if (user.id) {
            const response = await StaffService.getById(user.id);
            if (response && response.statusCode === 200) {
                const data = response.data;

                // Populate Form
                document.getElementById('profileId').value = data.id;
                document.getElementById('profileJoinDate').value = new Date().toISOString().split('T')[0]; // Mock Join Date
                document.getElementById('profileDept').value = data.tenPhongBan || 'Unknown';
                document.getElementById('profilePosition').value = data.chucVu || '-';

                document.getElementById('profileEmail').value = data.email || '';
                document.getElementById('profilePhone').value = data.soDienThoai || '';
                document.getElementById('profileAddress').value = data.diaChi || '';
                document.getElementById('profileDob').value = data.ngaySinh ? data.ngaySinh.split('T')[0] : '';
                
                // Thông tin nghề nghiệp
                const profileExperience = document.getElementById('profileExperience');
                const profileSkills = document.getElementById('profileSkills');
                if (profileExperience) profileExperience.value = data.soNamKinhNghiem || '';
                if (profileSkills) profileSkills.value = data.moTaKyNang || '';
            }
        }
    } catch (error) {
        console.error('Load Profile Error:', error);
        showToast('Failed to load profile details', 'danger');
    }
}

async function handleUpdateProfile() {
    const btn = document.getElementById('btnSaveProfile');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Saving...';

    const id = document.getElementById('profileId').value;
    const data = {
        id: parseInt(id),
        email: document.getElementById('profileEmail').value,
        soDienThoai: document.getElementById('profilePhone').value,
        diaChi: document.getElementById('profileAddress').value,
        ngaySinh: document.getElementById('profileDob').value,
        // We need to send other required fields too if the backend requires them for a full update.
        // StaffService.update usually expects the full object.
        // Ideally we should have fetched the full object, modified it, and sent it back.
        // For this snippet, we'll assume the backend can handle partial updates or we'd need to fetch-merge-update.
        // Let's try to fetch-merge-update pattern here for safety.
    };

    try {
        // 1. Fetch current data to get required fields we aren't changing (like Name, DeptId, etc)
        const currentRes = await StaffService.getById(id);
        if (currentRes && currentRes.statusCode === 200) {
            const currentData = currentRes.data;

            // 2. Merge
            const updatePayload = {
                ...currentData,
                email: data.email,
                soDienThoai: data.soDienThoai,
                diaChi: data.diaChi,
                ngaySinh: data.ngaySinh
            };

            // 3. Update
            const response = await StaffService.update(updatePayload);
            if (response && response.statusCode === 200) {
                showToast('Profile updated successfully!', 'success');
            } else {
                showToast('Failed to update profile: ' + (response?.message || 'Unknown error'), 'danger');
            }
        }
    } catch (error) {
        console.error('Update Profile Error:', error);
        showToast('Error updating profile', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function handlePasswordChange() {
    // Mock Implementation
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
        alert('Passwords do not match!');
        return;
    }

    if (newPass.length < 6) {
        alert('Password must be at least 6 characters.');
        return;
    }

    // Simulate API Call
    const btn = document.getElementById('btnSavePassword');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Update';
        alert('Password changed successfully! (Mock)');
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
        modal.hide();
        document.getElementById('changePasswordForm').reset();
    }, 1000);
}

// --- Dashboard Logic ---
async function loadDashboard(container) {
    const user = AuthService.getCurrentUser();

    if (user && (user.role === 'Admin' || user.role === 'QuanTri')) {
        await renderAdminDashboard(container);
    } else {
        await renderEmployeeDashboard(container, user);
    }
}

async function renderAdminDashboard(container) {
    showLoading(container, 'Loading dashboard stats...');

    try {
        const [staffRes, statsRes] = await Promise.all([
            StaffService.getAll(),
            DashboardService.getDashboard()
        ]);

        if (container.lastElementChild) container.lastElementChild.remove();

        const staffCount = (staffRes && staffRes.statusCode === 200) ? staffRes.data.length : 0;
        const stats = statsRes && statsRes.statusCode === 200 ? statsRes.data : null;

    const html = `
            <div class="row mb-4">
            <div class="col-md-4">
                <div class="card-custom">
                    <h5>Total Staff</h5>
                    <h2 class="text-primary fw-bold">${staffCount}</h2>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card-custom">
                        <h5>Total Salary Records</h5>
                        <h2 class="text-success fw-bold">${stats ? stats.salaryByMonth.length : 0}</h2>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card-custom">
                        <h5>Open Tasks</h5>
                        <h2 class="text-danger fw-bold">${stats ? stats.taskStatus.reduce((sum, x) => sum + (x.soLuong || 0), 0) : 0}</h2>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card-custom">
                        <h5 class="card-title mb-3">Salary by Month</h5>
                        <canvas id="salaryChart" height="180"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card-custom">
                        <h5 class="card-title mb-3">Leave Days by Month</h5>
                        <canvas id="leaveChart" height="180"></canvas>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card-custom">
                        <h5 class="card-title mb-3">Attendance Last 7 Days</h5>
                        <canvas id="attendanceChart" height="180"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card-custom">
                        <h5 class="card-title mb-3">Task Status Distribution</h5>
                        <canvas id="taskStatusChart" height="180"></canvas>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card-custom">
                        <h5 class="card-title mb-3">Top 5 Overtime by Employee</h5>
                        <canvas id="overtimeChart" height="200"></canvas>
                </div>
            </div>
        </div>
    `;

    container.innerHTML += html;

        if (stats) {
            renderDashboardCharts(stats);
        }
    } catch (error) {
        console.error('Admin dashboard error:', error);
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Error loading dashboard: ${error.message}</div>`;
    }
}

function renderDashboardCharts(stats) {
    if (!window.Chart) return;

    const salaryLabels = stats.salaryByMonth.map(x => `${x.thang}/${x.nam}`);
    const salaryData = stats.salaryByMonth.map(x => x.tongLuong);

    const leaveLabels = stats.leaveByMonth.map(x => `${x.thang}/${x.nam}`);
    const leaveData = stats.leaveByMonth.map(x => x.soNgayNghi);

    const attendanceLabels = stats.attendanceLast7Days.map(x => x.ngay);
    const attendanceOnTime = stats.attendanceLast7Days.map(x => x.dungGio);
    const attendanceTotal = stats.attendanceLast7Days.map(x => x.tong);

    const taskLabels = stats.taskStatus.map(x => x.trangThai);
    const taskData = stats.taskStatus.map(x => x.soLuong);

    const overtimeLabels = stats.overtimeByEmployee.map(x => x.tenNhanVien);
    const overtimeData = stats.overtimeByEmployee.map(x => x.tongGioOt);

    const salaryCtx = document.getElementById('salaryChart');
    if (salaryCtx) {
        new Chart(salaryCtx, {
            type: 'bar',
            data: {
                labels: salaryLabels,
                datasets: [{
                    label: 'Total Salary',
                    data: salaryData,
                    backgroundColor: 'rgba(59,130,246,0.6)'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    const leaveCtx = document.getElementById('leaveChart');
    if (leaveCtx) {
        new Chart(leaveCtx, {
            type: 'line',
            data: {
                labels: leaveLabels,
                datasets: [{
                    label: 'Leave Days',
                    data: leaveData,
                    borderColor: 'rgba(34,197,94,1)',
                    backgroundColor: 'rgba(34,197,94,0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true }
        });
    }

    const attendanceCtx = document.getElementById('attendanceChart');
    if (attendanceCtx) {
        new Chart(attendanceCtx, {
            type: 'line',
            data: {
                labels: attendanceLabels,
                datasets: [
                    {
                        label: 'On Time',
                        data: attendanceOnTime,
                        borderColor: 'rgba(59,130,246,1)',
                        backgroundColor: 'rgba(59,130,246,0.2)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Total',
                        data: attendanceTotal,
                        borderColor: 'rgba(148,163,184,1)',
                        backgroundColor: 'rgba(148,163,184,0.2)',
                        fill: false,
                        borderDash: [4, 4]
                    }
                ]
            },
            options: { responsive: true }
        });
    }

    const taskCtx = document.getElementById('taskStatusChart');
    if (taskCtx) {
        new Chart(taskCtx, {
            type: 'pie',
            data: {
                labels: taskLabels,
                datasets: [{
                    data: taskData,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']
                }]
            },
            options: { responsive: true }
        });
    }

    const overtimeCtx = document.getElementById('overtimeChart');
    if (overtimeCtx) {
        new Chart(overtimeCtx, {
            type: 'bar',
            data: {
                labels: overtimeLabels,
                datasets: [{
                    label: 'OT Hours',
                    data: overtimeData,
                    backgroundColor: 'rgba(234,179,8,0.7)'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

async function renderEmployeeDashboard(container, user) {
    showLoading(container, 'Checking Attendance Status...');

    try {
        const todayRes = await AttendanceService.getToday();
        container.lastElementChild.remove(); // Remove spinner

        let attendanceHtml = '';

        if (todayRes && todayRes.statusCode === 200 && todayRes.data) {
            // Already checked in
            const checkInTime = todayRes.data.gioVao ? todayRes.data.gioVao.split('T')[1].substring(0, 5) : 'Unknown';
            attendanceHtml = `
                <div class="card-custom bg-success text-white text-center p-5">
                    <div class="mb-3"><i class="fa-solid fa-circle-check fa-4x"></i></div>
                    <h3>You have checked in today!</h3>
                    <p class="fs-4">Time: <strong>${checkInTime}</strong></p>
                </div>
            `;
        } else {
            // Not checked in
            attendanceHtml = `
                <div class="card-custom text-center p-5">
                    <div class="mb-4"><i class="fa-solid fa-clock fa-4x text-primary"></i></div>
                    <h3>Good Morning, ${user.hoTen || user.username}!</h3>
                    <p class="text-muted mb-4">Please check in to start your work day.</p>
                    <button id="btnCheckIn" class="btn btn-primary btn-lg px-5 rounded-pill">
                        <i class="fa-solid fa-fingerprint me-2"></i> Check In Now
                    </button>
                </div>
            `;
        }

        container.innerHTML += `
            <div class="row justify-content-center">
                <div class="col-md-8">
                    ${attendanceHtml}
                </div>
            </div>
        `;

        const btnCheckIn = document.getElementById('btnCheckIn');
        if (btnCheckIn) {
            btnCheckIn.addEventListener('click', async () => {
                btnCheckIn.disabled = true;
                btnCheckIn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Processing...';

                try {
                    const checkInRes = await AttendanceService.checkIn();
                    if (checkInRes && checkInRes.statusCode === 200) {
                        showToast('Check-in successful!', 'success');
                        loadDashboard(container);
                    } else {
                        showToast('Check-in failed: ' + (checkInRes?.message || 'Unknown error'), 'danger');
                        btnCheckIn.disabled = false;
                        btnCheckIn.innerHTML = '<i class="fa-solid fa-fingerprint me-2"></i> Check In Now';
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Error checking in.', 'danger');
                    btnCheckIn.disabled = false;
                    btnCheckIn.innerHTML = '<i class="fa-solid fa-fingerprint me-2"></i> Check In Now';
                }
            });
        }

    } catch (error) {
        console.error('Dashboard Error:', error);
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Error loading dashboard: ${error.message}</div>`;
    }
}

// --- Helper: Loading Spinner ---
function showLoading(container, message = 'Loading...') {
    const spinner = document.createElement('div');
    spinner.innerHTML = `
        <div class="card-custom d-flex justify-content-center align-items-center" style="height: 200px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-2 text-muted">${message}</span>
        </div>
    `;
    container.appendChild(spinner);
}

// --- Staff Management Feature ---
async function loadStaffPage(container) {
    showLoading(container, 'Loading Staff Data...');
    try {
        const response = await StaffService.getAll();
        // Remove spinner
        container.lastElementChild.remove();

        if (response && response.statusCode === 200) {
            renderStaffTable(container, response.data);
        } else {
            container.innerHTML += `<div class="alert alert-danger">Failed to load staff data: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        console.error('Load Staff Error:', error);
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Error loading data: ${error.message}</div>`;
    }
}

function renderStaffTable(container, staffList) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">Staff List</h5>
            <button class="btn btn-primary btn-sm" id="btnAddStaff">
                <i class="fa-solid fa-plus me-2"></i> Add New Staff
            </button>
        </div>
    `;

    if (!Array.isArray(staffList) || staffList.length === 0) {
        html += `<div class="alert alert-info">No staff members found.</div>`;
        wrapper.innerHTML = html;
        container.appendChild(wrapper);
        attachAddButtonListener();
        return;
    }

    html += `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Position</th>
                        <th>Department</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Kinh nghiệm</th>
                        <th>Kỹ năng</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    staffList.forEach(staff => {
        const experience = staff.soNamKinhNghiem ? `${staff.soNamKinhNghiem} năm` : '-';
        const skills = staff.moTaKyNang ? (staff.moTaKyNang.length > 50 ? staff.moTaKyNang.substring(0, 50) + '...' : staff.moTaKyNang) : '-';
        
        html += `
            <tr>
                <td><span class="fw-bold">#${staff.id}</span></td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-light rounded-circle d-flex justify-content-center align-items-center me-2" style="width: 32px; height: 32px; color: #64748b;">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <span class="fw-medium">${staff.hoTen}</span>
                    </div>
                </td>
                <td><span class="badge bg-info text-dark bg-opacity-10 text-info border border-info border-opacity-25">${staff.chucVu || '-'}</span></td>
                <td>${staff.tenPhongBan || '-'}</td>
                <td class="text-muted-small">${staff.email || '-'}</td>
                <td class="text-muted-small">${staff.soDienThoai || '-'}</td>
                <td><span class="badge bg-secondary">${experience}</span></td>
                <td class="text-muted-small" style="max-width: 200px;" title="${staff.moTaKyNang || ''}">${skills}</td>
                <td>
                    <button class="btn btn-light btn-sm text-primary me-1 btn-edit-staff" data-id="${staff.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-light btn-sm text-danger btn-delete-staff" data-id="${staff.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    attachAddButtonListener();
    document.querySelectorAll('.btn-edit-staff').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            await openEditModal(id);
        });
    });
    document.querySelectorAll('.btn-delete-staff').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm(`Are you sure you want to delete staff ID ${id}?`)) {
                await deleteStaff(id);
            }
        });
    });
}

function attachAddButtonListener() {
    const btnAdd = document.getElementById('btnAddStaff');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            openAddModal();
        });
    }
}

// --- Department Management ---
async function loadDepartmentPage(container) {
    showLoading(container, 'Loading Departments...');
    try {
        const response = await DepartmentService.getAll();
        container.lastElementChild.remove();
        if (response && response.statusCode === 200) {
            renderDepartmentTable(container, response.data);
        } else {
            container.innerHTML += `<div class="alert alert-danger">Failed to load departments: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderDepartmentTable(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">Departments List</h5>
            <button class="btn btn-primary btn-sm" id="btnAddDepartment">
                <i class="fa-solid fa-plus me-2"></i> Add Department
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    list.forEach(item => {
        html += `
            <tr>
                <td>#${item.id}</td>
                <td class="fw-medium">${item.tenPhongBan}</td>
                <td class="text-muted">${item.moTa || ''}</td>
                <td>
                    <button class="btn btn-light btn-sm text-primary me-1 btn-edit-dept" data-id="${item.id}" 
                        data-name="${item.tenPhongBan}" data-desc="${item.moTa || ''}" title="Edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-light btn-sm text-danger btn-delete-dept" data-id="${item.id}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    // Event Listeners
    document.getElementById('btnAddDepartment').addEventListener('click', () => openDepartmentModal());

    document.querySelectorAll('.btn-edit-dept').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            openDepartmentModal({
                id: btn.dataset.id,
                tenPhongBan: btn.dataset.name,
                moTa: btn.dataset.desc
            });
        });
    });

    document.querySelectorAll('.btn-delete-dept').forEach(btn => {
        btn.addEventListener('click', (e) => deleteDepartment(e.currentTarget.dataset.id));
    });
}

// --- Department CRUD Logic ---
const departmentModal = new bootstrap.Modal(document.getElementById('departmentModal'));
const btnSaveDepartment = document.getElementById('btnSaveDepartment');
if (btnSaveDepartment) {
    btnSaveDepartment.addEventListener('click', handleSaveDepartment);
}

function openDepartmentModal(dept = null) {
    const form = document.getElementById('departmentForm');
    form.reset();
    document.getElementById('departmentId').value = '';
    document.getElementById('departmentModalLabel').textContent = 'Add New Department';

    if (dept) {
        document.getElementById('departmentId').value = dept.id;
        document.getElementById('deptName').value = dept.tenPhongBan;
        document.getElementById('deptDescription').value = dept.moTa;
        document.getElementById('departmentModalLabel').textContent = 'Edit Department';
    }

    departmentModal.show();
}

async function handleSaveDepartment() {
    const id = document.getElementById('departmentId').value;
    const data = {
        tenPhongBan: document.getElementById('deptName').value,
        moTa: document.getElementById('deptDescription').value
    };

    if (!data.tenPhongBan) {
        showToast('Department Name is required', 'warning');
        return;
    }

    const btn = document.getElementById('btnSaveDepartment');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        let response;
        if (id) {
            data.id = parseInt(id);
            response = await DepartmentService.update(data);
        } else {
            response = await DepartmentService.create(data);
        }

        if (response && response.statusCode === 200) {
            showToast(id ? 'Department updated' : 'Department added', 'success');
            departmentModal.hide();
            loadPage('department');
        } else {
            showToast('Failed: ' + (response?.message || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Error saving department', 'danger');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save';
    }
}

async function deleteDepartment(id) {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
        const response = await DepartmentService.delete(id);
        if (response && response.statusCode === 200) {
            showToast('Department deleted', 'success');
            loadPage('department');
        } else {
            showToast('Failed to delete: ' + (response?.message || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Error deleting department', 'danger');
    }
}

// --- Leave Requests ---
async function loadLeavePage(container) {
    showLoading(container, 'Loading Leave Requests...');
    try {
        const response = await LeaveService.getAll();
        container.lastElementChild.remove();
        if (response && response.statusCode === 200) {
            renderLeaveTable(container, response.data);
        } else {
            container.innerHTML += `<div class="alert alert-danger">Failed to load leave requests: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderLeaveTable(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';
    const user = AuthService.getCurrentUser();
    const isAdmin = user && (user.role === 'Admin' || user.role === 'QuanTri');

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">Leave Requests</h5>
            <button class="btn btn-primary btn-sm" id="btnAddLeave">
                <i class="fa-solid fa-plus me-2"></i> New Request
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Approver</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    list.forEach(item => {
        let statusHtml = '';
        let actions = '';

        if (isAdmin) {
            // Admin sees a Select dropdown - only Approved/Rejected (cannot revert to Pending)
            statusHtml = `
                <select class="form-select form-select-sm status-select" data-id="${item.id}" style="width: 130px;">
                    <option value="" disabled ${item.trangThai === 'Chờ duyệt' ? 'selected' : ''}>Chờ duyệt</option>
                    <option value="Approved" ${item.trangThai === 'Đã duyệt' ? 'selected' : ''}>Đã duyệt</option>
                    <option value="Rejected" ${item.trangThai === 'Từ chối' ? 'selected' : ''}>Từ chối</option>
                </select>
            `;

            // Admin Actions: Save Button
            actions = `
                <button class="btn btn-primary btn-sm btn-save-leave-status" data-id="${item.id}" title="Save Status">
                    <i class="fa-solid fa-save"></i> Save
                </button>
            `;
        } else {
            // Employee sees a Badge
            let badgeClass = 'bg-secondary';
            if (item.trangThai === 'Đã duyệt') badgeClass = 'bg-success';
            if (item.trangThai === 'Chờ duyệt') badgeClass = 'bg-warning text-dark';
            if (item.trangThai === 'Từ chối') badgeClass = 'bg-danger';

            statusHtml = `<span class="badge ${badgeClass}">${item.trangThai}</span>`;

            // Employee Actions: Edit/Delete if Pending
            if (item.trangThai === 'Chờ duyệt') {
                actions = `
                    <button class="btn btn-light btn-sm text-primary me-1 btn-edit-leave" data-id="${item.id}" 
                        data-start="${item.ngayBatDau}" data-end="${item.ngayKetThuc}" data-reason="${item.lyDo}" title="Edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-light btn-sm text-danger me-1 btn-delete-leave" data-id="${item.id}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
            }
        }

        html += `
            <tr>
                <td>#${item.id}</td>
                <td>${item.ngayBatDau.split('T')[0]}</td>
                <td>${item.ngayKetThuc.split('T')[0]}</td>
                <td>${item.lyDo}</td>
                <td>${statusHtml}</td>
                <td>${item.nguoiDuyet || '-'}</td>
                <td>${actions}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    // Event Listeners
    document.getElementById('btnAddLeave').addEventListener('click', () => openLeaveModal());

    // Employee Listeners
    document.querySelectorAll('.btn-edit-leave').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            openLeaveModal({
                id: btn.dataset.id,
                ngayBatDau: btn.dataset.start,
                ngayKetThuc: btn.dataset.end,
                lyDo: btn.dataset.reason
            });
        });
    });

    document.querySelectorAll('.btn-delete-leave').forEach(btn => {
        btn.addEventListener('click', (e) => deleteLeaveRequest(e.currentTarget.dataset.id));
    });

    // Admin Listeners
    if (isAdmin) {
        document.querySelectorAll('.btn-save-leave-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                // Find the select element for this row
                const select = document.querySelector(`.status-select[data-id="${id}"]`);
                if (select) {
                    const newStatus = select.value;
                    approveRejectLeave(id, newStatus);
                }
            });
        });
    }
}

// --- Leave CRUD Logic ---
const leaveModal = new bootstrap.Modal(document.getElementById('leaveModal'));
const btnSaveLeave = document.getElementById('btnSaveLeave');
if (btnSaveLeave) {
    btnSaveLeave.addEventListener('click', handleSaveLeaveRequest);
}

function openLeaveModal(req = null) {
    const form = document.getElementById('leaveForm');
    form.reset();
    document.getElementById('leaveId').value = '';
    document.getElementById('leaveModalLabel').textContent = 'New Leave Request';

    if (req) {
        document.getElementById('leaveId').value = req.id;
        document.getElementById('leaveStartDate').value = req.ngayBatDau.split('T')[0];
        document.getElementById('leaveEndDate').value = req.ngayKetThuc.split('T')[0];
        document.getElementById('leaveReason').value = req.lyDo;
        document.getElementById('leaveModalLabel').textContent = 'Edit Leave Request';
    }

    leaveModal.show();
}

async function handleSaveLeaveRequest() {
    const id = document.getElementById('leaveId').value;
    const data = {
        ngayBatDau: document.getElementById('leaveStartDate').value,
        ngayKetThuc: document.getElementById('leaveEndDate').value,
        lyDo: document.getElementById('leaveReason').value
    };

    if (!data.ngayBatDau || !data.ngayKetThuc || !data.lyDo) {
        showToast('Please fill all fields', 'warning');
        return;
    }

    const btn = document.getElementById('btnSaveLeave');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    try {
        let response;
        if (id) {
            data.id = parseInt(id);
            response = await LeaveService.update(data);
        } else {
            response = await LeaveService.create(data);
        }

        if (response && response.statusCode === 200) {
            showToast(id ? 'Request updated' : 'Request sent', 'success');
            leaveModal.hide();
            loadPage('leave');
        } else {
            showToast('Failed: ' + (response?.message || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Error saving request', 'danger');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Request';
    }
}

async function deleteLeaveRequest(id) {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
        const response = await LeaveService.delete(id);
        if (response && response.statusCode === 200) {
            showToast('Request deleted', 'success');
            loadPage('leave');
        } else {
            showToast('Failed to delete: ' + (response?.message || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Error deleting request', 'danger');
    }
}

async function approveRejectLeave(id, status) {
    if (!confirm(`Are you sure you want to set status to ${status}?`)) return;

    try {
        // Map frontend status string to backend boolean
        // Backend expects: { RequestId: long, IsApproved: bool, Note: string }
        const isApproved = status === 'Approved';

        const payload = {
            requestId: parseInt(id),
            isApproved: isApproved,
            note: '' // Optional note
        };

        const response = await LeaveService.approveReject(payload);

        if (response && response.statusCode === 200) {
            showToast(`Request ${status}`, 'success');
            loadPage('leave');
        } else {
            showToast('Failed: ' + (response?.message || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Error processing request', 'danger');
    }
}

// --- Salary ---
async function loadSalaryPage(container) {
    showLoading(container, 'Loading Salary Info...');
    try {
        const response = await SalaryService.getAllSalary();
        container.lastElementChild.remove();
        if (response && response.statusCode === 200) {
            renderSalaryExportControls(container);
            renderSalaryTable(container, response.data);
        } else {
            container.innerHTML += `<div class="alert alert-danger">Failed to load salary: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderSalaryTable(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';
    let html = `<h5 class="card-title mb-4">All Salary Records</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Employee</th><th>Month/Year</th><th>Base Salary</th><th>Work Days</th><th>Bonus</th><th>Allowance</th><th>Deduction</th><th>Total</th></tr></thead><tbody>`;

    if (list.length === 0) {
        html += `<tr><td colspan="8" class="text-center">No salary records found.</td></tr>`;
    } else {
        list.forEach(item => {
            html += `<tr>
                <td class="fw-medium">${item.nhanVien}</td>
                <td class="fw-bold">${item.thang}/${item.nam}</td>
                <td>${formatMoney(item.luongCoBan)}</td>
                <td>${item.soNgayCong}</td>
                <td class="text-success">${formatMoney(item.thuong)}</td>
                <td class="text-info">${formatMoney(item.phuCap)}</td>
                <td class="text-danger">${formatMoney(item.khauTru)}</td>
                <td class="fw-bold text-primary">${formatMoney(item.tongLuong)}</td>
            </tr>`;
        });
    }
    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
}

function renderSalaryExportControls(container) {
    const card = document.createElement('div');
    card.className = 'card-custom mb-3';
    card.innerHTML = `
        <div class="row g-2 align-items-end mb-3">
            <div class="col-md-3">
                <label class="form-label">Tháng</label>
                <input type="number" min="1" max="12" class="form-control" id="exportMonth" placeholder="1-12">
            </div>
            <div class="col-md-3">
                <label class="form-label">Năm</label>
                <input type="number" class="form-control" id="exportYear" placeholder="2025">
            </div>
            <div class="col-md-6 text-end">
                <button class="btn btn-outline-primary me-2" id="btnExportExcel">
                    <i class="fa-solid fa-file-excel me-1"></i> Export Excel
                </button>
            </div>
        </div>
        <div class="border-top pt-3">
            <h6 class="mb-3">Import Excel</h6>
            <div class="row g-2 align-items-end">
                <div class="col-md-8">
                    <label class="form-label">Chọn file Excel</label>
                    <input type="file" class="form-control" id="importExcelFile" accept=".xlsx,.xls">
                    <small class="text-muted d-block mt-1">
                        <strong>Định dạng file:</strong> .xlsx hoặc .xls<br>
                        <strong>Cấu trúc cột (có thể có hoặc không có cột STT):</strong><br>
                        Cột 1 (tùy chọn): STT<br>
                        Cột 1 hoặc 2: <strong>Tên nhân viên</strong> (bắt buộc, phải khớp với tên trong hệ thống)<br>
                        Cột 2 hoặc 3: <strong>Tháng</strong> (1-12, bắt buộc)<br>
                        Cột 3 hoặc 4: <strong>Năm</strong> (bắt buộc)<br>
                        Cột 4-9 hoặc 5-10: Lương cơ bản, Số ngày công, Thưởng, Phụ cấp, Khấu trừ, Tổng lương (tùy chọn)
                    </small>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-success" id="btnImportExcel">
                        <i class="fa-solid fa-file-import me-1"></i> Import Excel
                    </button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(card);

    const btnExportExcel = card.querySelector('#btnExportExcel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', async () => {
            const thang = parseInt(document.getElementById('exportMonth').value) || undefined;
            const nam = parseInt(document.getElementById('exportYear').value) || undefined;
            btnExportExcel.disabled = true;
            btnExportExcel.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang xuất...';
            try {
                const blob = await SalaryService.exportAllExcel(thang, nam);
                downloadBlob(blob, `BangLuong_${thang || 'all'}_${nam || 'all'}.xlsx`);
                showToast('Xuất Excel thành công', 'success');
            } catch (err) {
                console.error(err);
                showToast('Xuất Excel thất bại', 'danger');
            } finally {
                btnExportExcel.disabled = false;
                btnExportExcel.innerHTML = '<i class="fa-solid fa-file-excel me-1"></i> Export Excel';
            }
        });
    }

    const btnImportExcel = card.querySelector('#btnImportExcel');
    const importFileInput = card.querySelector('#importExcelFile');
    if (btnImportExcel && importFileInput) {
        btnImportExcel.addEventListener('click', async () => {
            const file = importFileInput.files[0];
            if (!file) {
                showToast('Vui lòng chọn file Excel', 'warning');
                return;
            }

            btnImportExcel.disabled = true;
            btnImportExcel.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang import...';
            
            try {
                const response = await SalaryService.importExcel(file);
                
                if (response.statusCode === 200) {
                    const { successCount, errorCount, errors } = response.data;
                    
                    // Show detailed result
                    if (errorCount > 0 && errors && errors.length > 0) {
                        // Show errors in a modal or detailed message
                        let errorDetails = errors.slice(0, 10).join('\n'); // Show first 10 errors
                        if (errors.length > 10) {
                            errorDetails += `\n... và ${errors.length - 10} lỗi khác`;
                        }
                        
                        // Show alert with details
                        alert(`Import kết quả:\n- Thành công: ${successCount} bản ghi\n- Lỗi: ${errorCount} bản ghi\n\nChi tiết lỗi:\n${errorDetails}`);
                        
                        if (successCount > 0) {
                            showToast(`Import thành công ${successCount} bản ghi. Có ${errorCount} lỗi (xem chi tiết trong alert)`, 'warning');
                        } else {
                            showToast(`Import thất bại: ${errorCount} lỗi (xem chi tiết trong alert)`, 'danger');
                        }
                    } else if (successCount > 0) {
                        showToast(`Import thành công ${successCount} bản ghi`, 'success');
                    } else {
                        showToast('Không có dữ liệu nào được import. Vui lòng kiểm tra lại file Excel', 'warning');
                    }
                    
                    // Reload salary table
                    const contentArea = document.getElementById('content-area');
                    if (contentArea) {
                        loadSalaryPage(contentArea);
                    }
                    
                    // Clear file input
                    importFileInput.value = '';
                } else {
                    showToast(response.message || 'Import thất bại', 'danger');
                }
            } catch (err) {
                console.error('Import error:', err);
                showToast(err.message || 'Import thất bại', 'danger');
            } finally {
                btnImportExcel.disabled = false;
                btnImportExcel.innerHTML = '<i class="fa-solid fa-file-import me-1"></i> Import Excel';
            }
        });
    }
}

function downloadBlob(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

// --- Tasks ---
async function loadTaskPage(container) {
    showLoading(container, 'Loading Tasks...');
    try {
        const response = await TaskService.getAllTasks();
        container.lastElementChild.remove();
        if (response && response.statusCode === 200) {
            renderTaskTable(container, response.data);
        } else {
            container.innerHTML += `<div class="alert alert-danger">Failed to load tasks: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderTaskTable(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">All Tasks</h5>
            <button class="btn btn-primary btn-sm" id="btnAssignTask">
                <i class="fa-solid fa-plus me-2"></i> Assign Task
            </button>
        </div>
        <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Title</th><th>Description</th><th>Start Date</th><th>Deadline</th><th>Status</th><th>Assigner</th><th>Assignee</th></tr></thead><tbody>`;

    if (list.length === 0) {
        html += `<tr><td colspan="7" class="text-center">No tasks found.</td></tr>`;
    } else {
        list.forEach(item => {
            let badgeClass = 'bg-secondary';
            if (item.trangThai === 'Hoàn thành') badgeClass = 'bg-success';
            if (item.trangThai === 'Đang thực hiện') badgeClass = 'bg-primary';
            if (item.trangThai === 'Mới giao') badgeClass = 'bg-info';

            html += `<tr>
                <td class="fw-medium">${item.tieuDe}</td>
                <td class="text-muted-small">${item.moTa || '-'}</td>
                <td>${item.ngayBatDau || '-'}</td>
                <td>${item.hanHoanThanh ? item.hanHoanThanh.split('T')[0] : '-'}</td>
                <td><span class="badge ${badgeClass}">${item.trangThai}</span></td>
                <td>${item.nguoiGiao}</td>
                <td>${item.nguoiNhan}</td>
            </tr>`;
        });
    }
    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    // Attach event listener for Assign Task button
    const btnAssignTask = document.getElementById('btnAssignTask');
    if (btnAssignTask) {
        btnAssignTask.addEventListener('click', () => openAssignTaskModal());
    }
}

// --- Assign Task Modal Logic ---
const assignTaskModal = new bootstrap.Modal(document.getElementById('assignTaskModal'));
const btnSaveTask = document.getElementById('btnSaveTask');
if (btnSaveTask) {
    btnSaveTask.addEventListener('click', handleSaveTask);
}

async function openAssignTaskModal() {
    const form = document.getElementById('assignTaskForm');
    form.reset();
    document.getElementById('assignTaskModalLabel').textContent = 'Giao việc mới';

    // Load danh sách nhân viên
    const assigneeSelect = document.getElementById('taskAssignee');
    assigneeSelect.innerHTML = '<option value="">-- Đang tải... --</option>';

    try {
        const staffRes = await StaffService.getAll();
        if (staffRes && staffRes.statusCode === 200 && Array.isArray(staffRes.data)) {
            assigneeSelect.innerHTML = '<option value="">-- Chọn nhân viên --</option>';
            staffRes.data.forEach(staff => {
                const option = document.createElement('option');
                option.value = staff.id;
                option.textContent = `${staff.hoTen}${staff.chucVu ? ' - ' + staff.chucVu : ''}`;
                assigneeSelect.appendChild(option);
            });
        } else {
            assigneeSelect.innerHTML = '<option value="">-- Không có nhân viên --</option>';
            showToast('Không thể tải danh sách nhân viên', 'warning');
        }
    } catch (error) {
        console.error('Load staff error:', error);
        assigneeSelect.innerHTML = '<option value="">-- Lỗi tải dữ liệu --</option>';
        showToast('Lỗi khi tải danh sách nhân viên', 'danger');
    }

    assignTaskModal.show();
}

async function handleSaveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const assigneeId = document.getElementById('taskAssignee').value;
    const deadline = document.getElementById('taskDeadline').value;

    // Validation
    if (!title) {
        showToast('Vui lòng nhập tiêu đề công việc', 'warning');
        return;
    }

    if (!assigneeId) {
        showToast('Vui lòng chọn người nhận', 'warning');
        return;
    }

    const btn = document.getElementById('btnSaveTask');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang giao việc...';

    try {
        const data = {
            TieuDe: title,
            MoTa: description || null,
            IdNguoiNhan: parseInt(assigneeId),
            HanHoanThanh: deadline ? deadline : null
        };

        const response = await TaskService.assignTask(data);

        if (response && response.statusCode === 200) {
            showToast('Giao việc thành công!', 'success');
            assignTaskModal.hide();
            loadPage('tasks'); // Reload task list
        } else {
            showToast('Giao việc thất bại: ' + (response?.message || 'Lỗi không xác định'), 'danger');
        }
    } catch (error) {
        console.error('Assign task error:', error);
        showToast('Lỗi khi giao việc: ' + (error.message || 'Lỗi không xác định'), 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// --- Overtime Management (Admin) ---
async function loadOvertimeAdminPage(container) {
    showLoading(container, 'Loading overtime data...');
    try {
        const response = await OvertimeService.getAllOt();
        if (container.lastElementChild) container.lastElementChild.remove();
        if (response && response.statusCode === 200) {
            renderOvertimeAdminTable(container, response.data || []);
        } else {
            container.innerHTML += `<div class="alert alert-danger">Failed to load overtime: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

// --- Project Management ---
async function loadProjectPage(container) {
    showLoading(container, 'Đang tải danh sách dự án...');
    try {
        const response = await ProjectService.getAll();
        container.lastElementChild.remove();
        if (response && response.statusCode === 200) {
            renderProjectTable(container, response.data);
        } else {
            container.innerHTML += `<div class="alert alert-danger">Không thể tải danh sách dự án: ${response?.message || 'Lỗi không xác định'}</div>`;
        }
    } catch (error) {
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Lỗi: ${error.message}</div>`;
    }
}

function renderProjectTable(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">Danh sách dự án</h5>
            <button class="btn btn-primary btn-sm" id="btnAddProject">
                <i class="fa-solid fa-plus me-2"></i> Thêm dự án
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên dự án</th>
                        <th>Ngày bắt đầu</th>
                        <th>Ngày kết thúc</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (!Array.isArray(list) || list.length === 0) {
        html += `<tr><td colspan="6" class="text-center">Chưa có dự án nào.</td></tr>`;
    } else {
        list.forEach(item => {
            let badgeClass = 'bg-secondary';
            if (item.trangThai === 'Hoàn thành') badgeClass = 'bg-success';
            if (item.trangThai === 'Đang thực hiện') badgeClass = 'bg-primary';
            if (item.trangThai === 'Tạm dừng') badgeClass = 'bg-warning text-dark';
            if (item.trangThai === 'Hủy') badgeClass = 'bg-danger';

            const startDate = item.ngayBatDau ? new Date(item.ngayBatDau).toLocaleDateString('vi-VN') : '-';
            const endDate = item.ngayKetThuc ? new Date(item.ngayKetThuc).toLocaleDateString('vi-VN') : '-';

            html += `
                <tr>
                    <td><span class="fw-bold">#${item.id}</span></td>
                    <td class="fw-medium">${item.tenDuAn || '-'}</td>
                    <td>${startDate}</td>
                    <td>${endDate}</td>
                    <td><span class="badge ${badgeClass}">${item.trangThai || 'Chưa xác định'}</span></td>
                    <td>
                        <button class="btn btn-light btn-sm text-primary me-1 btn-edit-project" 
                            data-id="${item.id}" 
                            data-name="${item.tenDuAn || ''}" 
                            data-start="${item.ngayBatDau || ''}" 
                            data-end="${item.ngayKetThuc || ''}" 
                            data-status="${item.trangThai || ''}" 
                            title="Sửa">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-light btn-sm text-danger btn-delete-project" 
                            data-id="${item.id}" 
                            title="Xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    // Event Listeners
    document.getElementById('btnAddProject').addEventListener('click', () => openProjectModal());

    document.querySelectorAll('.btn-edit-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            openProjectModal({
                id: btn.dataset.id,
                tenDuAn: btn.dataset.name,
                ngayBatDau: btn.dataset.start,
                ngayKetThuc: btn.dataset.end,
                trangThai: btn.dataset.status
            });
        });
    });

    document.querySelectorAll('.btn-delete-project').forEach(btn => {
        btn.addEventListener('click', (e) => deleteProject(e.currentTarget.dataset.id));
    });
}

function renderOvertimeAdminTable(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">Today Overtime Requests</h5>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Hours</th>
                        <th>Coefficient</th>
                        <th>Reason</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>`;

    if (!list || list.length === 0) {
        html += `<tr><td colspan="8" class="text-center">No overtime requests for today.</td></tr>`;
    } else {
        list.forEach(item => {
            let badgeClass = 'bg-secondary';
            if (item.trangThai === 'Chờ duyệt') badgeClass = 'bg-warning text-dark';
            if (item.trangThai === 'Duyệt' || item.trangThai === 'Đã duyệt') badgeClass = 'bg-success';
            if (item.trangThai === 'Từ chối') badgeClass = 'bg-danger';

            html += `
                <tr>
                    <td class="fw-medium">${item.tenNhanVien || '-'}</td>
                    <td>${item.ngayTangCa || '-'}</td>
                    <td>${item.gioBatDau || '-'}</td>
                    <td>${item.gioKetThuc || '-'}</td>
                    <td>${item.soGioLam || '-'}</td>
                    <td>${item.heSo || '-'}</td>
                    <td>${item.lyDoTangCa || '-'}</td>
                    <td><span class="badge ${badgeClass}">${item.trangThai || '-'}</span></td>
                </tr>`;
        });
    }

    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
}

// --- Project CRUD Logic ---
const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
const btnSaveProject = document.getElementById('btnSaveProject');
if (btnSaveProject) {
    btnSaveProject.addEventListener('click', handleSaveProject);
}

function openProjectModal(project = null) {
    const form = document.getElementById('projectForm');
    form.reset();
    document.getElementById('projectId').value = '';
    document.getElementById('projectModalLabel').textContent = 'Thêm dự án mới';

    if (project) {
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectName').value = project.tenDuAn || '';
        
        if (project.ngayBatDau) {
            const startDate = new Date(project.ngayBatDau).toISOString().split('T')[0];
            document.getElementById('projectStartDate').value = startDate;
        }
        
        if (project.ngayKetThuc) {
            const endDate = new Date(project.ngayKetThuc).toISOString().split('T')[0];
            document.getElementById('projectEndDate').value = endDate;
        }
        
        document.getElementById('projectStatus').value = project.trangThai || 'Đang thực hiện';
        document.getElementById('projectModalLabel').textContent = 'Sửa dự án';
    }

    projectModal.show();
}

async function handleSaveProject() {
    const id = document.getElementById('projectId').value;
    const startDateValue = document.getElementById('projectStartDate').value;
    const endDateValue = document.getElementById('projectEndDate').value;
    
    const data = {
        TenDuAn: document.getElementById('projectName').value.trim(),
        NgayBatDau: startDateValue ? new Date(startDateValue + 'T00:00:00').toISOString() : null,
        NgayKetThuc: endDateValue ? new Date(endDateValue + 'T00:00:00').toISOString() : null,
        TrangThai: document.getElementById('projectStatus').value || 'Đang thực hiện'
    };

    if (!data.TenDuAn) {
        showToast('Vui lòng nhập tên dự án', 'warning');
        return;
    }

    const btn = document.getElementById('btnSaveProject');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

    try {
        let response;
        if (id) {
            data.Id = parseInt(id);
            response = await ProjectService.update(data);
        } else {
            response = await ProjectService.create(data);
        }

        if (response && response.statusCode === 200) {
            showToast(id ? 'Cập nhật dự án thành công' : 'Thêm dự án thành công', 'success');
            projectModal.hide();
            loadPage('project');
        } else {
            showToast('Thất bại: ' + (response?.message || 'Lỗi không xác định'), 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Lỗi khi lưu dự án', 'danger');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu';
    }
}

async function deleteProject(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này?')) return;

    try {
        const response = await ProjectService.delete(id);
        if (response && response.statusCode === 200) {
            showToast('Xóa dự án thành công', 'success');
            loadPage('project');
        } else {
            showToast('Xóa thất bại: ' + (response?.message || 'Lỗi không xác định'), 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Lỗi khi xóa dự án', 'danger');
    }
}

// --- Modal & CRUD Logic (Staff) ---
const staffModal = new bootstrap.Modal(document.getElementById('staffModal'));

function openAddModal() {
    document.getElementById('staffForm').reset();
    document.getElementById('staffId').value = '';
    document.getElementById('staffModalLabel').textContent = 'Add New Staff';
    staffModal.show();
}

async function openEditModal(id) {
    try {
        const response = await StaffService.getById(id);
        if (response && response.statusCode === 200) {
            const staff = response.data;

            // Populate Form
            document.getElementById('staffId').value = staff.id;
            document.getElementById('fullName').value = staff.hoTen;
            document.getElementById('dob').value = staff.ngaySinh ? staff.ngaySinh.split('T')[0] : '';
            document.getElementById('gender').value = staff.gioiTinh || 'Nam';
            document.getElementById('phone').value = staff.soDienThoai || '';
            document.getElementById('email').value = staff.email || '';
            document.getElementById('address').value = staff.diaChi || '';
            document.getElementById('departmentId').value = staff.idPhongBan || '';
            document.getElementById('position').value = staff.chucVu || '';
            document.getElementById('salary').value = staff.luongCoBan || '';

            document.getElementById('staffModalLabel').textContent = 'Edit Staff';
            staffModal.show();
        } else {
            alert('Failed to load staff details: ' + (response?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Get Staff Error:', error);
        alert('Error loading staff details');
    }
}

async function handleSaveStaff() {
    const id = document.getElementById('staffId').value;
    const data = {
        hoTen: document.getElementById('fullName').value,
        ngaySinh: document.getElementById('dob').value || null,
        gioiTinh: document.getElementById('gender').value,
        soDienThoai: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        diaChi: document.getElementById('address').value,
        idPhongBan: document.getElementById('departmentId').value ? parseInt(document.getElementById('departmentId').value) : null,
        chucVu: document.getElementById('position').value,
        luongCoBan: document.getElementById('salary').value ? parseFloat(document.getElementById('salary').value) : null
    };

    if (!data.hoTen) {
        alert('Full Name is required');
        return;
    }

    try {
        let response;
        if (id) {
            // Update
            data.id = parseInt(id);
            response = await StaffService.update(data);
        } else {
            // Create
            response = await StaffService.create(data);
        }

        if (response && response.statusCode === 200) {
            alert(id ? 'Staff updated successfully' : 'Staff added successfully');
            staffModal.hide();
            loadPage('staff'); // Reload table
        } else {
            alert('Failed to save: ' + (response?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Save Staff Error:', error);
        alert('Error saving staff');
    }
}

async function deleteStaff(id) {
    try {
        const response = await StaffService.delete(id);
        if (response && response.statusCode === 200) {
            alert('Staff deleted successfully');
            loadPage('staff');
        } else {
            alert(`Failed to delete: ${response?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Delete Staff Error:', error);
        alert(`Error deleting staff: ${error.message}`);
    }
}

// --- CV Management (Kanban Board) ---
async function loadCvPage(container) {
    showLoading(container, 'Đang tải danh sách ứng viên...');
    try {
        const response = await UngVienService.getAll();
        container.lastElementChild.remove();
        
        if (response && response.statusCode === 200) {
            const ungViens = response.data || [];
            renderCvKanbanBoard(container, ungViens);
        } else {
            container.innerHTML += `<div class="alert alert-danger">Không thể tải danh sách ứng viên: ${response?.message || 'Lỗi không xác định'}</div>`;
        }
    } catch (error) {
        if (container.lastElementChild) container.lastElementChild.remove();
        container.innerHTML += `<div class="alert alert-danger">Lỗi: ${error.message}</div>`;
    }
}

function renderCvKanbanBoard(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cv-kanban-container';
    
    // Phân loại ứng viên theo TrangThaiHienTai
    const ungViensByStatus = {
        0: [], // Mới
        1: [], // Phỏng vấn
        2: []  // Offer
    };
    
    list.forEach(uv => {
        const status = uv.trangThaiHienTai ?? 0;
        if (ungViensByStatus.hasOwnProperty(status)) {
            ungViensByStatus[status].push(uv);
        } else {
            ungViensByStatus[0].push(uv); // Mặc định vào "Mới"
        }
    });
    
    const columns = [
        { status: 0, title: 'Mới', color: '#3b82f6', icon: 'fa-inbox' },
        { status: 1, title: 'Phỏng vấn', color: '#f59e0b', icon: 'fa-comments' },
        { status: 2, title: 'Offer', color: '#10b981', icon: 'fa-handshake' }
    ];
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">
                <i class="fa-solid fa-file-lines me-2"></i>CV Management - Kanban Board
            </h5>
        </div>
        <div class="cv-kanban-board">
    `;
    
    columns.forEach(column => {
        const ungViens = ungViensByStatus[column.status] || [];
        const count = ungViens.length;
        
        html += `
            <div class="cv-kanban-column" data-status="${column.status}">
                <div class="cv-kanban-column-header" style="border-left: 4px solid ${column.color};">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fa-solid ${column.icon} me-2" style="color: ${column.color};"></i>
                            <span class="fw-bold">${column.title}</span>
                        </div>
                        <span class="badge" style="background-color: ${column.color}20; color: ${column.color};">
                            ${count}
                        </span>
                    </div>
                </div>
                <div class="cv-kanban-column-body" id="cv-column-${column.status}">
        `;
        
        if (ungViens.length === 0) {
            html += `
                <div class="cv-kanban-empty">
                    <i class="fa-solid fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="text-muted small mb-0">Chưa có ứng viên</p>
                </div>
            `;
        } else {
            ungViens.forEach(uv => {
                const email = uv.email || '-';
                const phone = uv.soDienThoai || '-';
                const viTri = uv.viTriUngTuyen || '-';
                const ngayNop = uv.ngayNopHoSo ? new Date(uv.ngayNopHoSo).toLocaleDateString('vi-VN') : '-';
                const idDanhGia = uv.idDanhGia ?? 0;
                
                html += `
                    <div class="cv-kanban-card cv-kanban-card-clickable" 
                         data-id="${uv.id}" 
                         data-status="${uv.trangThaiHienTai ?? 0}"
                         data-id-danh-gia="${idDanhGia}">
                        <div class="cv-kanban-card-header">
                            <h6 class="cv-kanban-card-title">${uv.hoTen || 'Chưa có tên'}</h6>
                        </div>
                        <div class="cv-kanban-card-body">
                            <div class="cv-kanban-card-info">
                                <div class="cv-info-item">
                                    <i class="fa-solid fa-envelope text-muted"></i>
                                    <span class="small text-muted">${email}</span>
                                </div>
                                <div class="cv-info-item">
                                    <i class="fa-solid fa-phone text-muted"></i>
                                    <span class="small text-muted">${phone}</span>
                                </div>
                                <div class="cv-info-item">
                                    <i class="fa-solid fa-briefcase text-muted"></i>
                                    <span class="small text-muted">${viTri}</span>
                                </div>
                                <div class="cv-info-item">
                                    <i class="fa-solid fa-calendar text-muted"></i>
                                    <span class="small text-muted">${ngayNop}</span>
                                </div>
                            </div>
                            ${uv.duongDanCv ? `
                                <div class="mt-2">
                                    <a href="${uv.duongDanCv}" target="_blank" class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation();">
                                        <i class="fa-solid fa-file-pdf me-1"></i>Xem CV
                                    </a>
                                </div>
                            ` : ''}
                            <div class="mt-2">
                                <button class="btn btn-sm btn-outline-info w-100" onclick="event.stopPropagation(); openCvEvaluationModal(${uv.id}, ${idDanhGia})">
                                    <i class="fa-solid fa-clipboard-check me-1"></i>${idDanhGia === 0 ? 'Thêm đánh giá' : 'Xem đánh giá'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
    
    // Setup drag and drop với SortableJS
    setupCvKanbanDragAndDrop();
    
    // Setup click handlers cho cards
    setupCvCardClickHandlers(wrapper);
}

function setupCvKanbanDragAndDrop() {
    const columns = [0, 1, 2];
    
    columns.forEach(status => {
        const columnElement = document.getElementById(`cv-column-${status}`);
        if (!columnElement) return;
        
        new Sortable(columnElement, {
            group: 'cv-kanban',
            animation: 150,
            ghostClass: 'cv-kanban-ghost',
            dragClass: 'cv-kanban-drag',
            onEnd: async function(evt) {
                const card = evt.item;
                const cardId = parseInt(card.dataset.id);
                const oldStatus = parseInt(card.dataset.status);
                const newStatus = parseInt(evt.to.closest('.cv-kanban-column').dataset.status);
                
                // Nếu trạng thái không thay đổi thì không làm gì
                if (oldStatus === newStatus) {
                    return;
                }
                
                // Cập nhật data-status của card
                card.dataset.status = newStatus;
                
                // Gọi API để cập nhật TrangThaiHienTai
                try {
                    const response = await UngVienService.update({
                        Id: cardId,
                        TrangThaiHienTai: newStatus
                    });
                    
                    if (response && response.statusCode === 200) {
                        showToast('Cập nhật trạng thái ứng viên thành công', 'success');
                    } else {
                        showToast('Cập nhật thất bại: ' + (response?.message || 'Lỗi không xác định'), 'danger');
                        // Revert lại vị trí cũ nếu lỗi
                        const oldColumn = document.getElementById(`cv-column-${oldStatus}`);
                        if (oldColumn) {
                            oldColumn.appendChild(card);
                            card.dataset.status = oldStatus;
                        }
                    }
                } catch (error) {
                    console.error('Update CV status error:', error);
                    showToast('Lỗi khi cập nhật trạng thái', 'danger');
                    // Revert lại vị trí cũ nếu lỗi
                    const oldColumn = document.getElementById(`cv-column-${oldStatus}`);
                    if (oldColumn) {
                        oldColumn.appendChild(card);
                        card.dataset.status = oldStatus;
                    }
                }
            }
        });
    });
}

// Setup click handlers cho CV cards
function setupCvCardClickHandlers(wrapper) {
    const clickableCards = wrapper.querySelectorAll('.cv-kanban-card-clickable');
    
    clickableCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Không mở modal nếu click vào button hoặc link
            if (e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            
            const idUngVien = parseInt(card.dataset.id);
            const idDanhGia = parseInt(card.dataset.idDanhGia) || 0;
            openCvEvaluationModal(idUngVien, idDanhGia);
        });
    });
}

// Mở modal đánh giá ứng viên
window.openCvEvaluationModal = async function(idUngVien, idDanhGia) {
    const modal = new bootstrap.Modal(document.getElementById('cvEvaluationModal'));
    const form = document.getElementById('cvEvaluationForm');
    
    // Reset form
    form.reset();
    document.getElementById('evaluationId').value = idDanhGia;
    document.getElementById('evaluationIdUngVien').value = idUngVien;
    
    // Set giá trị mặc định
    document.getElementById('evaluationMaNguoiDanhGia').value = 1; // Mã người đánh giá mặc định = 1
    
    // Set ngày đánh giá mặc định = hôm nay
    const today = new Date();
    const localDateTime = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
    document.getElementById('evaluationNgayDanhGia').value = localDateTime;
    
    // Set title
    const modalLabel = document.getElementById('cvEvaluationModalLabel');
    if (idDanhGia === 0) {
        modalLabel.textContent = 'Thêm đánh giá ứng viên';
    } else {
        modalLabel.textContent = 'Cập nhật đánh giá ứng viên';
    }
    
    // Nếu idDanhGia != 0, load dữ liệu từ API
    if (idDanhGia !== 0) {
        const btnSave = document.getElementById('btnSaveEvaluation');
        const originalText = btnSave.innerHTML;
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang tải...';
        
        try {
            const response = await UngVienService.getLichSuDanhGiaById(idDanhGia);
            
            if (response && response.statusCode === 200) {
                const data = response.data;
                
                // Populate form
                document.getElementById('evaluationVongPhongVan').value = data.vongPhongVan || '';
                document.getElementById('evaluationNhanXetChuyenMon').value = data.nhanXetChuyenMon || '';
                document.getElementById('evaluationDiemSo').value = data.diemSo || '';
                
                if (data.ketQua !== null && data.ketQua !== undefined) {
                    document.getElementById('evaluationKetQua').value = data.ketQua ? 'true' : 'false';
                }
                
                if (data.ngayDanhGia) {
                    const ngayDanhGia = new Date(data.ngayDanhGia);
                    const localDateTime = new Date(ngayDanhGia.getTime() - ngayDanhGia.getTimezoneOffset() * 60000)
                        .toISOString().slice(0, 16);
                    document.getElementById('evaluationNgayDanhGia').value = localDateTime;
                }
                
                // Nếu có mã người đánh giá từ API thì dùng, không thì giữ mặc định = 1
                if (data.maNguoiDanhGia) {
                    document.getElementById('evaluationMaNguoiDanhGia').value = data.maNguoiDanhGia;
                }
            } else {
                showToast('Không thể tải dữ liệu đánh giá: ' + (response?.message || 'Lỗi không xác định'), 'danger');
            }
        } catch (error) {
            console.error('Load evaluation error:', error);
            showToast('Lỗi khi tải dữ liệu đánh giá', 'danger');
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = originalText;
        }
    }
    
    modal.show();
};

// Setup save button handler
document.addEventListener('DOMContentLoaded', () => {
    const btnSaveEvaluation = document.getElementById('btnSaveEvaluation');
    if (btnSaveEvaluation) {
        btnSaveEvaluation.addEventListener('click', handleSaveCvEvaluation);
    }
});

async function handleSaveCvEvaluation() {
    const idDanhGia = parseInt(document.getElementById('evaluationId').value) || 0;
    const idUngVien = parseInt(document.getElementById('evaluationIdUngVien').value);
    const vongPhongVan = document.getElementById('evaluationVongPhongVan').value.trim();
    const nhanXetChuyenMon = document.getElementById('evaluationNhanXetChuyenMon').value.trim();
    const diemSo = document.getElementById('evaluationDiemSo').value ? parseFloat(document.getElementById('evaluationDiemSo').value) : null;
    const ketQuaValue = document.getElementById('evaluationKetQua').value;
    const ketQua = ketQuaValue === '' ? null : (ketQuaValue === 'true');
    const ngayDanhGiaValue = document.getElementById('evaluationNgayDanhGia').value;
    const ngayDanhGia = ngayDanhGiaValue ? new Date(ngayDanhGiaValue) : null;
    const maNguoiDanhGia = document.getElementById('evaluationMaNguoiDanhGia').value ? parseInt(document.getElementById('evaluationMaNguoiDanhGia').value) : null;
    
    // Validation
    if (!vongPhongVan) {
        showToast('Vui lòng nhập vòng phỏng vấn', 'warning');
        return;
    }
    
    const btn = document.getElementById('btnSaveEvaluation');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang lưu...';
    
    try {
        const data = {
            Id: idDanhGia,
            IdUngVien: idUngVien,
            VongPhongVan: vongPhongVan,
            NhanXetChuyenMon: nhanXetChuyenMon || null,
            DiemSo: diemSo,
            KetQua: ketQua,
            NgayDanhGia: ngayDanhGia,
            MaNguoiDanhGia: maNguoiDanhGia
        };
        
        const response = await UngVienService.updateLichSuDanhGia(data);
        
        if (response && response.statusCode === 200) {
            showToast(idDanhGia === 0 ? 'Thêm đánh giá thành công' : 'Cập nhật đánh giá thành công', 'success');
            
            // Đóng modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('cvEvaluationModal'));
            modal.hide();
            
            // Reload CV page để cập nhật idDanhGia
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                loadCvPage(contentArea);
            }
        } else {
            showToast('Lưu thất bại: ' + (response?.message || 'Lỗi không xác định'), 'danger');
        }
    } catch (error) {
        console.error('Save evaluation error:', error);
        showToast('Lỗi khi lưu đánh giá', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
