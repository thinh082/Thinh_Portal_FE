import AuthService from './services/authService.js';
import StaffService from './services/staffService.js';
import SalaryService from './services/salaryService.js';
import TaskService from './services/taskService.js';
import LeaveService from './services/leaveService.js';
import AttendanceService from './services/attendanceService.js';
import OvertimeService from './services/overtimeService.js';
import { formatMoney, showToast } from './utils.js';

const TASK_STATUS_OPTIONS = ['Mới giao', 'Đang thực hiện', 'Hoàn thành'];

// --- Global State & Initialization ---
function initEmployeePortal() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const user = AuthService.getCurrentUser();
    if (user) {
        const userInfoEl = document.getElementById('userInfo');
        if (userInfoEl) {
            userInfoEl.textContent = `${user.username}`;
        }
    }

    setupEventListeners();
    loadPage('profile');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmployeePortal);
} else {
    initEmployeePortal();
}

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
            e.preventDefault();

            const action = e.currentTarget.getAttribute('data-action');
            if (action === 'checkin') {
                handleCheckIn();
                return;
            }
            if (action === 'checkout') {
                handleCheckOut();
                return;
            }

            navLinks.forEach(l => {
                if (l.getAttribute('data-action') !== 'checkin') {
                    l.classList.remove('active');
                }
            });

            e.currentTarget.classList.add('active');

            const page = e.currentTarget.getAttribute('data-page');
            if (page) {
                loadPage(page);
            }
        });
    });

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

    // Overtime Form Submit
    const overtimeForm = document.getElementById('overtimeForm');
    if (overtimeForm) {
        overtimeForm.addEventListener('submit', handleOvertimeSubmit);

        const startInput = document.getElementById('otStartTime');
        const endInput = document.getElementById('otEndTime');
        const hoursInput = document.getElementById('otHours');
        const coefficientInput = document.getElementById('otCoefficient');

        if (coefficientInput) {
            coefficientInput.value = 1.5;
        }

        const recalcHours = () => {
            if (!startInput || !endInput || !hoursInput) return;
            const startVal = startInput.value;
            const endVal = endInput.value;
            if (!startVal || !endVal) {
                hoursInput.value = '';
                return;
            }
            const [sh, sm] = startVal.split(':').map(Number);
            const [eh, em] = endVal.split(':').map(Number);
            let startMinutes = sh * 60 + sm;
            let endMinutes = eh * 60 + em;
            if (endMinutes < startMinutes) {
                endMinutes += 24 * 60;
            }
            const diffHours = (endMinutes - startMinutes) / 60;
            const rounded = Math.round(diffHours * 2) / 2;
            hoursInput.value = rounded.toString();
        };

        if (startInput) startInput.addEventListener('change', recalcHours);
        if (endInput) endInput.addEventListener('change', recalcHours);

        const btnShowForm = document.getElementById('btnShowOvertimeForm');
        if (btnShowForm) {
            btnShowForm.addEventListener('click', () => {
                if (overtimeForm.style.display === 'none' || overtimeForm.style.display === '') {
                    overtimeForm.style.display = 'block';
                } else {
                    overtimeForm.style.display = 'none';
                }
            });
        }
    }

    // Leave Request Modal Submit Button
    const btnSubmitLeaveRequest = document.getElementById('btnSubmitLeaveRequest');
    if (btnSubmitLeaveRequest) {
        btnSubmitLeaveRequest.addEventListener('click', handleLeaveRequestSubmit);
    }
}

// --- Page Loading Logic ---
function loadPage(page) {
    const contentArea = document.getElementById('content-area');
    const profileSection = document.getElementById('profile-section');

    if (!contentArea || !profileSection) return;

    // Helper to hide all dynamic sections
    const hideAllSections = () => {
        contentArea.style.display = 'none';
        profileSection.style.display = 'none';
        const otSection = document.getElementById('overtime-section');
        if (otSection) otSection.style.display = 'none';
        const tasksSection = document.getElementById('tasks-section');
        if (tasksSection) tasksSection.style.display = 'none';
        const leaveSection = document.getElementById('leave-section');
        if (leaveSection) leaveSection.style.display = 'none';
    };

    console.log('Loading page:', page);

    if (page === 'profile') {
        hideAllSections();
        profileSection.style.display = 'block';
        loadProfile();
        return;
    }

    // Handle Salary View
    if (page === 'salary') {
        hideAllSections();
        contentArea.style.display = 'block';
        contentArea.innerHTML = '';
        const pageTitle = 'My Salary';
        const breadcrumbHtml = `
            <div class="page-header">
                <h1 class="page-title">${pageTitle}</h1>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="#">Home</a></li>
                        <li class="breadcrumb-item active" aria-current="page">${pageTitle}</li>
                    </ol>
                </nav>
            </div>
        `;
        contentArea.innerHTML = breadcrumbHtml;
        renderSalaryExportControls(contentArea); // controls for export PDF (self)
        loadSalaryPage(contentArea);
    } else if (page === 'overtime') {
        hideAllSections();
        const otSection = document.getElementById('overtime-section');
        if (otSection) {
            otSection.style.display = 'block';
            loadOvertimePage(otSection);
        }
    } else if (page === 'tasks') {
        hideAllSections();
        const tasksSection = document.getElementById('tasks-section');
        console.log('Tasks section found:', tasksSection);
        if (tasksSection) {
            tasksSection.style.display = 'block';
            loadTasksPage(tasksSection);
        } else {
            console.error('Tasks section not found in DOM');
        }
    } else if (page === 'leave') {
        hideAllSections();
        const leaveSection = document.getElementById('leave-section');
        if (leaveSection) {
            leaveSection.style.display = 'block';
            loadLeavePage(leaveSection);
        }
    }
}

// --- Profile Logic ---
async function loadProfile() {
    const user = AuthService.getCurrentUser();
    if (!user) return;

    // Set Avatar & Basic Info
    document.getElementById('profileName').textContent = user.hoTen || user.username;
    document.getElementById('profileRole').textContent = user.role || 'Employee';
    document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen || user.username)}&background=0d6efd&color=fff&size=128`;

    try {
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
    };

    try {
        const currentRes = await StaffService.getById(id);
        if (currentRes && currentRes.statusCode === 200) {
            const currentData = currentRes.data;
            const updatePayload = {
                ...currentData,
                email: data.email,
                soDienThoai: data.soDienThoai,
                diaChi: data.diaChi,
                ngaySinh: data.ngaySinh
            };

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

// --- Salary Logic ---
async function loadSalaryPage(container) {
    showLoading(container, 'Loading Salary Info...');
    try {
        const response = await SalaryService.getMySalary();
        container.lastElementChild.remove();
        if (response && response.statusCode === 200) {
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
    let html = `<h5 class="card-title mb-4">My Salary History</h5><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Month/Year</th><th>Base Salary</th><th>Work Days</th><th>Bonus</th><th>Total</th></tr></thead><tbody>`;
    list.forEach(item => {
        html += `<tr>
            <td class="fw-bold">${item.thang}/${item.nam}</td>
            <td>${formatMoney(item.luongCoBan)}</td>
            <td>${item.soNgayCong}</td>
            <td class="text-success">${formatMoney(item.thuong)}</td>
            <td class="fw-bold text-primary">${formatMoney(item.tongLuong)}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
}

function renderSalaryExportControls(container) {
    const card = document.createElement('div');
    card.className = 'card-custom mb-3';
    card.innerHTML = `
        <div class="row g-2 align-items-end">
            <div class="col-md-3">
                <label class="form-label">Tháng</label>
                <input type="number" min="1" max="12" class="form-control" id="exportMonthEmployee" placeholder="1-12">
            </div>
            <div class="col-md-3">
                <label class="form-label">Năm</label>
                <input type="number" class="form-control" id="exportYearEmployee" placeholder="2025">
            </div>
            <div class="col-md-6 text-end">
                <button class="btn btn-outline-danger me-2" id="btnExportPdfEmployee">
                    <i class="fa-solid fa-file-pdf me-1"></i> Export PDF
                </button>
            </div>
        </div>
    `;
    container.appendChild(card);

    const btnExportPdf = card.querySelector('#btnExportPdfEmployee');
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', async () => {
            const thang = parseInt(document.getElementById('exportMonthEmployee').value) || undefined;
            const nam = parseInt(document.getElementById('exportYearEmployee').value) || undefined;
            btnExportPdf.disabled = true;
            btnExportPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang xuất...';
            try {
                const blob = await SalaryService.exportMyPdf(thang, nam);
                downloadBlob(blob, `BangLuong_CaNhan_${thang || 'all'}_${nam || 'all'}.pdf`);
                showToast('Xuất PDF thành công', 'success');
            } catch (err) {
                console.error(err);
                showToast('Xuất PDF thất bại', 'danger');
            } finally {
                btnExportPdf.disabled = false;
                btnExportPdf.innerHTML = '<i class="fa-solid fa-file-pdf me-1"></i> Export PDF';
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

// --- Tasks Logic ---
async function loadTasksPage(container) {
    showLoading(container, 'Loading Tasks...');
    try {
        const response = await TaskService.getMyTasks();
        container.innerHTML = '';
        if (response && response.statusCode === 200) {
            renderTasksTable(container, response.data);
        } else {
            container.innerHTML = `<div class="alert alert-danger">Failed to load tasks: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderTasksTable(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">My Tasks</h5>
        </div>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Start Date</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Assigner</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>`;

    if (list.length === 0) {
        html += `<tr><td colspan="7" class="text-center">No tasks assigned.</td></tr>`;
    } else {
        list.forEach(item => {
            const selectOptions = TASK_STATUS_OPTIONS.map(status => `
                <option value="${status}" ${status === item.trangThai ? 'selected' : ''}>${status}</option>
            `).join('');
            html += `<tr>
                <td class="fw-medium">${item.tieuDe}</td>
                <td class="text-muted-small">${item.moTa || '-'}</td>
                <td>${item.ngayBatDau || '-'}</td>
                <td>${item.hanHoanThanh ? item.hanHoanThanh.split('T')[0] : '-'}</td>
                <td>
                    <select class="form-select form-select-sm task-status-select" data-id="${item.id}">
                        ${selectOptions}
                    </select>
                </td>
                <td>${item.nguoiGiao}</td>
                <td>
                    <button class="btn btn-primary btn-sm btn-save-task-status" data-id="${item.id}">
                        Save
                    </button>
                </td>
            </tr>`;
        });
    }
    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    wrapper.querySelectorAll('.btn-save-task-status').forEach(btn => {
        btn.addEventListener('click', () => handleSaveTaskStatus(btn, container));
    });
}

async function handleSaveTaskStatus(button, container) {
    const id = button.dataset.id;
    const row = button.closest('tr');
    const select = row ? row.querySelector('.task-status-select') : null;

    if (!select || !select.value) {
        showToast('Vui lòng chọn trạng thái hợp lệ', 'warning');
        return;
    }

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Saving...';

    try {
        const response = await TaskService.updateStatus(parseInt(id), select.value, '');
        if (response && response.statusCode === 200) {
            showToast('Cập nhật trạng thái thành công', 'success');
            loadTasksPage(container);
        } else {
            showToast(response?.message || 'Không thể cập nhật trạng thái', 'danger');
        }
    } catch (error) {
        console.error('Update Task Status Error:', error);
        showToast('Lỗi khi cập nhật trạng thái', 'danger');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// --- Overtime Logic ---
async function loadOvertimePage(section) {
    const listContainer = document.getElementById('otListContainer');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    showLoading(listContainer, 'Loading overtime requests...');

    try {
        const response = await OvertimeService.getMyOt();
        listContainer.innerHTML = '';
        if (response && response.statusCode === 200) {
            renderOvertimeTable(listContainer, response.data || []);
        } else {
            listContainer.innerHTML = `<div class="alert alert-danger">Failed to load overtime requests: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        console.error('Load OT error:', error);
        listContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderOvertimeTable(container, list) {
    const wrapper = document.createElement('div');
    let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
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
        html += `<tr><td colspan="7" class="text-center">No overtime requests found.</td></tr>`;
    } else {
        list.forEach(item => {
            let badgeClass = 'bg-secondary';
            if (item.trangThai === 'Chờ duyệt') badgeClass = 'bg-warning text-dark';
            if (item.trangThai === 'Duyệt' || item.trangThai === 'Đã duyệt') badgeClass = 'bg-success';
            if (item.trangThai === 'Từ chối') badgeClass = 'bg-danger';

            const date = item.ngayTangCa || '-';
            html += `
                <tr>
                    <td>${date}</td>
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
    wrapper.className = 'mt-2';
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
}

async function handleOvertimeSubmit(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Submitting...';

    const data = {
        gioBatDau: document.getElementById('otStartTime').value,
        gioKetThuc: document.getElementById('otEndTime').value,
        soGioLam: parseFloat(document.getElementById('otHours').value),
        heSo: 1.5,
        lyDoTangCa: document.getElementById('otReason').value
    };

    try {
        const response = await OvertimeService.requestOt(data);
        if (response && response.statusCode === 200) {
            showToast('Overtime request submitted successfully!', 'success');
            document.getElementById('overtimeForm').reset();

            const listContainer = document.getElementById('otListContainer');
            if (listContainer) {
                loadOvertimePage(document.getElementById('overtime-section'));
            }
        } else {
            showToast(response?.message || 'Error submitting overtime request', 'danger');
        }
    } catch (error) {
        console.error('Overtime Submit Error:', error);
        showToast('Error submitting overtime request', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// --- Leave Requests Logic ---
async function loadLeavePage(container) {
    showLoading(container, 'Loading leave requests...');
    try {
        const response = await LeaveService.getMyLeaveRequests();
        container.innerHTML = '';
        if (response && response.statusCode === 200) {
            renderLeaveRequestsTable(container, response.data);
        } else {
            container.innerHTML = `<div class="alert alert-danger">Failed to load leave requests: ${response?.message || 'Unknown error'}</div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function renderLeaveRequestsTable(container, list) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-custom';

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">My Leave Requests</h5>
            <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#leaveRequestModal">
                <i class="fa-solid fa-calendar-plus me-2"></i> Request Leave
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Approver</th>
                        <th>Approval Date</th>
                    </tr>
                </thead>
                <tbody>`;

    if (list.length === 0) {
        html += `<tr><td colspan="6" class="text-center">No leave requests found.</td></tr>`;
    } else {
        list.forEach(item => {
            let badgeClass = 'bg-secondary';
            if (item.trangThai === 'Đã duyệt') badgeClass = 'bg-success';
            if (item.trangThai === 'Chờ duyệt') badgeClass = 'bg-warning text-dark';
            if (item.trangThai === 'Từ chối') badgeClass = 'bg-danger';

            const startDate = item.ngayBatDau ? item.ngayBatDau.split('T')[0] : '-';
            const endDate = item.ngayKetThuc ? item.ngayKetThuc.split('T')[0] : '-';
            const approvalDate = item.ngayDuyet ? new Date(item.ngayDuyet).toLocaleDateString() : '-';

            html += `<tr>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${item.lyDo}</td>
                <td><span class="badge ${badgeClass}">${item.trangThai}</span></td>
                <td>${item.nguoiDuyet || '-'}</td>
                <td>${approvalDate}</td>
            </tr>`;
        });
    }

    html += `</tbody></table></div>`;
    wrapper.innerHTML = html;
    container.appendChild(wrapper);
}

async function handleLeaveRequestSubmit() {
    const btn = document.getElementById('btnSubmitLeaveRequest');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Submitting...';

    const data = {
        ngayBatDau: document.getElementById('leaveStartDate').value,
        ngayKetThuc: document.getElementById('leaveEndDate').value,
        lyDo: document.getElementById('leaveReason').value
    };

    try {
        const response = await LeaveService.create(data);
        if (response && response.statusCode === 200) {
            showToast('Leave request submitted successfully!', 'success');
            document.getElementById('leaveRequestForm').reset();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('leaveRequestModal'));
            modal.hide();

            // Reload leave requests list
            const leaveSection = document.getElementById('leave-section');
            if (leaveSection && leaveSection.style.display !== 'none') {
                loadLeavePage(leaveSection);
            }
        } else {
            showToast('Failed to submit leave request: ' + (response?.message || 'Unknown error'), 'danger');
        }
    } catch (error) {
        console.error('Leave Request Submit Error:', error);
        showToast('Error submitting leave request', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleCheckIn() {
    try {
        const viTri = await getLocationText();
        const response = await AttendanceService.checkIn(viTri);
        if (response && response.statusCode === 200) {
            showToast(response.message || 'Check-in thành công', 'success');
        } else {
            showToast(response?.message || 'Check-in thất bại', 'danger');
        }
    } catch (error) {
        console.error('Check-in Error:', error);
        showToast('Không thể check-in. Vui lòng thử lại.', 'danger');
    }
}

async function handleCheckOut() {
    try {
        const viTri = await getLocationText();
        const response = await AttendanceService.checkOut(viTri);
        if (response && response.statusCode === 200) {
            showToast(response.message || 'Check-out thành công', 'success');
        } else {
            showToast(response?.message || 'Check-out thất bại', 'danger');
        }
    } catch (error) {
        console.error('Check-out Error:', error);
        showToast('Không thể check-out. Vui lòng thử lại.', 'danger');
    }
}

// --- Helper Functions ---
async function getLocationText() {
    if (!navigator.geolocation) {
        return null;
    }
    return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                resolve(`${latitude},${longitude}`);
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    });
}

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
