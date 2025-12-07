import AuthService from './services/authService.js';
import StaffService from './services/staffService.js';
import SalaryService from './services/salaryService.js';
import TaskService from './services/taskService.js';
import LeaveService from './services/leaveService.js';
import AttendanceService from './services/attendanceService.js';
import OvertimeService from './services/overtimeService.js';
import { formatMoney, showToast, initDarkMode } from './utils.js';

const TASK_STATUS_OPTIONS = ['Mới giao', 'Đang thực hiện', 'Hoàn thành'];

// --- Global State & Initialization ---
function initEmployeePortal() {
    // Initialize Dark Mode
    initDarkMode();
    
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
                document.getElementById('profileExperience').value = data.soNamKinhNghiem || '';
                document.getElementById('profileSkills').value = data.moTaKyNang || '';
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

// --- Tasks Logic (Kanban Board) ---
async function loadTasksPage(container) {
    showLoading(container, 'Đang tải công việc...');
    try {
        const response = await TaskService.getMyTasks();
        console.log('Tasks API Response:', response);
        container.innerHTML = '';
        
        if (response && response.statusCode === 200) {
            const tasks = response.data || [];
            console.log('Tasks data:', tasks);
            console.log('Tasks count:', tasks.length);
            
            if (Array.isArray(tasks) && tasks.length > 0) {
                renderKanbanBoard(container, tasks);
            } else {
                renderKanbanBoard(container, []);
            }
        } else {
            container.innerHTML = `<div class="alert alert-danger">Không thể tải công việc: ${response?.message || 'Lỗi không xác định'}</div>`;
        }
    } catch (error) {
        console.error('Load Tasks Error:', error);
        container.innerHTML = `<div class="alert alert-danger">Lỗi: ${error.message}</div>`;
    }
}

function renderKanbanBoard(container, list) {
    console.log('Rendering Kanban Board with tasks:', list);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'kanban-container';
    
    // Phân loại tasks theo trạng thái
    const tasksByStatus = {
        'Mới giao': [],
        'Đang thực hiện': [],
        'Hoàn thành': []
    };

    if (!Array.isArray(list)) {
        console.warn('List is not an array:', list);
        list = [];
    }

    list.forEach(task => {
        const status = task.trangThai || task.TrangThai || 'Mới giao';
        console.log('Task:', task, 'Status:', status);
        
        if (tasksByStatus[status]) {
            tasksByStatus[status].push(task);
        } else {
            // Nếu trạng thái không khớp, thêm vào "Mới giao"
            tasksByStatus['Mới giao'].push(task);
        }
    });
    
    console.log('Tasks by status:', tasksByStatus);

    const columns = [
        { status: 'Mới giao', title: 'Mới giao', color: '#3b82f6', icon: 'fa-inbox' },
        { status: 'Đang thực hiện', title: 'Đang thực hiện', color: '#f59e0b', icon: 'fa-spinner' },
        { status: 'Hoàn thành', title: 'Hoàn thành', color: '#10b981', icon: 'fa-check-circle' }
    ];

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="card-title mb-0">
                <i class="fa-solid fa-tasks me-2"></i>My Tasks - Kanban Board
            </h5>
        </div>
        <div class="kanban-board">
    `;

    columns.forEach(column => {
        const tasks = tasksByStatus[column.status] || [];
        const taskCount = tasks.length;
        
        html += `
            <div class="kanban-column" data-status="${column.status}">
                <div class="kanban-column-header" style="border-left: 4px solid ${column.color};">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fa-solid ${column.icon} me-2" style="color: ${column.color};"></i>
                            <span class="fw-bold">${column.title}</span>
                        </div>
                        <span class="badge" style="background-color: ${column.color}20; color: ${column.color};">
                            ${taskCount}
                        </span>
                    </div>
                </div>
                <div class="kanban-column-body" id="kanban-${column.status.replace(/\s+/g, '-')}">
        `;

        if (tasks.length === 0) {
            html += `
                <div class="kanban-empty">
                    <i class="fa-solid fa-inbox text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="text-muted small mb-0">Chưa có công việc</p>
                </div>
            `;
        } else {
            tasks.forEach(task => {
                // Xử lý các trường có thể có tên khác nhau (camelCase vs PascalCase)
                const taskId = task.id || task.Id;
                const taskTitle = task.tieuDe || task.TieuDe || 'Không có tiêu đề';
                const taskDescription = task.moTa || task.MoTa || '';
                const taskStatus = task.trangThai || task.TrangThai || 'Mới giao';
                const taskAssignee = task.nguoiGiao || task.NguoiGiao || '';
                const taskDeadline = task.hanHoanThanh || task.HanHoanThanh || null;
                const taskProject = task.duAn || task.DuAn || '';
                const taskStartDate = task.ngayBatDau || task.NgayBatDau || null;
                
                // Xử lý deadline
                let deadline = null;
                let isOverdue = false;
                
                if (taskDeadline) {
                    try {
                        // Nếu là string, parse nó
                        const deadlineDate = typeof taskDeadline === 'string' 
                            ? new Date(taskDeadline) 
                            : new Date(taskDeadline);
                        
                        if (!isNaN(deadlineDate.getTime())) {
                            deadline = deadlineDate.toLocaleDateString('vi-VN');
                            isOverdue = deadlineDate < new Date() && taskStatus !== 'Hoàn thành';
                        }
                    } catch (e) {
                        console.warn('Error parsing deadline:', e);
                    }
                }
                
                // Xác định xem card có thể click không (chỉ "Mới giao" và "Đang thực hiện")
                const isClickable = taskStatus === 'Mới giao' || taskStatus === 'Đang thực hiện';
                const clickableClass = isClickable ? 'kanban-card-clickable' : '';
                const cursorStyle = isClickable ? 'cursor: pointer;' : '';
                
                html += `
                    <div class="kanban-card ${clickableClass}" 
                         draggable="true" 
                         data-id="${taskId}" 
                         data-status="${taskStatus}"
                         style="${cursorStyle}">
                        <div class="kanban-card-header">
                            <h6 class="kanban-card-title">${taskTitle}</h6>
                        </div>
                        <div class="kanban-card-body">
                            ${taskDescription ? `<p class="kanban-card-description">${taskDescription}</p>` : ''}
                            <div class="kanban-card-meta">
                                ${taskAssignee ? `
                                    <div class="kanban-meta-item">
                                        <i class="fa-solid fa-user-tie text-muted"></i>
                                        <span class="small text-muted">${taskAssignee}</span>
                                    </div>
                                ` : ''}
                                ${deadline ? `
                                    <div class="kanban-meta-item ${isOverdue ? 'text-danger' : ''}">
                                        <i class="fa-solid fa-calendar-days ${isOverdue ? 'text-danger' : 'text-muted'}"></i>
                                        <span class="small ${isOverdue ? 'text-danger fw-bold' : 'text-muted'}">
                                            ${isOverdue ? '⚠ ' : ''}${deadline}
                                        </span>
                                    </div>
                                ` : ''}
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
    
    console.log('Kanban HTML generated, appending to container');
    console.log('Container element:', container);
    
    // Clear container first
    container.innerHTML = '';
    container.appendChild(wrapper);
    console.log('Kanban board appended successfully');

    // Setup drag and drop - use wrapper instead of container
    setupKanbanDragAndDrop(wrapper);
    
    // Setup click handlers for task cards (only for "Mới giao" and "Đang thực hiện")
    setupTaskCardClickHandlers(wrapper);
}

function setupKanbanDragAndDrop(wrapper) {
    const cards = wrapper.querySelectorAll('.kanban-card');
    const columns = wrapper.querySelectorAll('.kanban-column-body');

    console.log('Setting up drag and drop. Cards:', cards.length, 'Columns:', columns.length);

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', (e) => handleDrop(e, wrapper));
        column.addEventListener('dragenter', handleDragEnter);
        column.addEventListener('dragleave', handleDragLeave);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    const columns = document.querySelectorAll('.kanban-column-body');
    columns.forEach(col => col.classList.remove('drag-over'));
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

async function handleDrop(e, wrapper) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    this.classList.remove('drag-over');

    if (draggedElement && draggedElement !== this) {
        const taskId = parseInt(draggedElement.dataset.id);
        const newStatus = this.closest('.kanban-column').dataset.status;
        const oldStatus = draggedElement.dataset.status;

        console.log('Dropping task:', taskId, 'from', oldStatus, 'to', newStatus);

        if (newStatus !== oldStatus) {
            // Update UI immediately
            draggedElement.dataset.status = newStatus;
            this.appendChild(draggedElement);

            // Update status on server
            try {
                const response = await TaskService.updateStatus(taskId, newStatus, '');
                if (response && response.statusCode === 200) {
                    showToast('Cập nhật trạng thái thành công', 'success');
                } else {
                    // Revert on error
                    showToast('Không thể cập nhật trạng thái', 'danger');
                    // Reload tasks
                    const tasksSection = document.getElementById('tasks-section');
                    if (tasksSection) {
                        loadTasksPage(tasksSection);
                    }
                }
            } catch (error) {
                console.error('Update Task Status Error:', error);
                showToast('Lỗi khi cập nhật trạng thái', 'danger');
                // Reload tasks
                const tasksSection = document.getElementById('tasks-section');
                if (tasksSection) {
                    loadTasksPage(tasksSection);
                }
            }
        }
    }

    draggedElement = null;
    return false;
}

// --- Task Detail Modal Logic ---
function setupTaskCardClickHandlers(wrapper) {
    const clickableCards = wrapper.querySelectorAll('.kanban-card-clickable');
    console.log('Setting up click handlers for', clickableCards.length, 'clickable cards');
    
    clickableCards.forEach(card => {
        // Remove inline onclick and use event listener instead
        card.removeAttribute('onclick');
        card.addEventListener('click', (e) => {
            // Prevent click when dragging
            if (!card.classList.contains('dragging')) {
                const taskId = parseInt(card.dataset.id);
                openTaskDetailModal(taskId);
            }
        });
    });
}

// Make function global so it can be called from inline onclick (fallback)
window.openTaskDetailModal = async function(taskId) {
    const modal = new bootstrap.Modal(document.getElementById('taskDetailModal'));
    const modalElement = document.getElementById('taskDetailModal');
    
    // Reset form
    document.getElementById('taskDetailForm').reset();
    document.getElementById('taskDetailId').value = taskId;
    
    // Show loading
    const btnUpdate = document.getElementById('btnUpdateTaskStatus');
    const originalBtnText = btnUpdate.innerHTML;
    btnUpdate.disabled = true;
    btnUpdate.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang tải...';
    
    try {
        // Get task details - we need to get from the list or call API
        // Since we already have the data, let's get it from the current tasks
        const tasksSection = document.getElementById('tasks-section');
        if (!tasksSection) return;
        
        // Reload task details from API
        const response = await TaskService.getMyTasks();
        if (response && response.statusCode === 200) {
            const tasks = response.data || [];
            const task = tasks.find(t => (t.id || t.Id) === taskId);
            
            if (task) {
                // Populate form
                const taskTitle = task.tieuDe || task.TieuDe || '';
                const taskDescription = task.moTa || task.MoTa || '';
                const taskStatus = task.trangThai || task.TrangThai || 'Mới giao';
                const taskAssignee = task.nguoiGiao || task.NguoiGiao || '';
                const taskDeadline = task.hanHoanThanh || task.HanHoanThanh || null;
                const taskProject = task.duAn || task.DuAn || '';
                const taskStartDate = task.ngayBatDau || task.NgayBatDau || null;
                
                document.getElementById('taskDetailTitle').value = taskTitle;
                document.getElementById('taskDetailDescription').value = taskDescription;
                document.getElementById('taskDetailAssigner').value = taskAssignee;
                document.getElementById('taskDetailStatus').value = taskStatus;
                document.getElementById('taskDetailProject').value = taskProject || '-';
                
                // Format dates
                if (taskStartDate) {
                    try {
                        const startDate = typeof taskStartDate === 'string' 
                            ? new Date(taskStartDate) 
                            : new Date(taskStartDate);
                        if (!isNaN(startDate.getTime())) {
                            document.getElementById('taskDetailStartDate').value = startDate.toLocaleDateString('vi-VN');
                        } else {
                            document.getElementById('taskDetailStartDate').value = '-';
                        }
                    } catch (e) {
                        document.getElementById('taskDetailStartDate').value = '-';
                    }
                } else {
                    document.getElementById('taskDetailStartDate').value = '-';
                }
                
                if (taskDeadline) {
                    try {
                        const deadlineDate = typeof taskDeadline === 'string' 
                            ? new Date(taskDeadline) 
                            : new Date(taskDeadline);
                        if (!isNaN(deadlineDate.getTime())) {
                            document.getElementById('taskDetailDeadline').value = deadlineDate.toLocaleDateString('vi-VN');
                        } else {
                            document.getElementById('taskDetailDeadline').value = '-';
                        }
                    } catch (e) {
                        document.getElementById('taskDetailDeadline').value = '-';
                    }
                } else {
                    document.getElementById('taskDetailDeadline').value = '-';
                }
                
                // Disable status select if task is completed
                const statusSelect = document.getElementById('taskDetailStatus');
                if (taskStatus === 'Hoàn thành') {
                    statusSelect.disabled = true;
                    btnUpdate.disabled = true;
                    btnUpdate.innerHTML = '<i class="fa-solid fa-lock me-2"></i>Không thể chỉnh sửa';
                } else {
                    statusSelect.disabled = false;
                    btnUpdate.disabled = false;
                    btnUpdate.innerHTML = originalBtnText;
                }
                
                modal.show();
            } else {
                showToast('Không tìm thấy thông tin công việc', 'warning');
            }
        } else {
            showToast('Không thể tải chi tiết công việc', 'danger');
        }
    } catch (error) {
        console.error('Load task detail error:', error);
        showToast('Lỗi khi tải chi tiết công việc', 'danger');
    } finally {
        if (document.getElementById('taskDetailStatus').value !== 'Hoàn thành') {
            btnUpdate.disabled = false;
            btnUpdate.innerHTML = originalBtnText;
        }
    }
};

// Setup update button handler
document.addEventListener('DOMContentLoaded', () => {
    const btnUpdateTaskStatus = document.getElementById('btnUpdateTaskStatus');
    if (btnUpdateTaskStatus) {
        btnUpdateTaskStatus.addEventListener('click', handleUpdateTaskStatus);
    }
});

async function handleUpdateTaskStatus() {
    const taskId = parseInt(document.getElementById('taskDetailId').value);
    const newStatus = document.getElementById('taskDetailStatus').value;
    const note = document.getElementById('taskDetailNote').value.trim();
    
    if (!taskId || !newStatus) {
        showToast('Vui lòng điền đầy đủ thông tin', 'warning');
        return;
    }
    
    const btn = document.getElementById('btnUpdateTaskStatus');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang cập nhật...';
    
    try {
        const response = await TaskService.updateStatus(taskId, newStatus, note);
        if (response && response.statusCode === 200) {
            showToast('Cập nhật trạng thái thành công', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
            modal.hide();
            
            // Reload tasks
            const tasksSection = document.getElementById('tasks-section');
            if (tasksSection) {
                loadTasksPage(tasksSection);
            }
        } else {
            showToast('Cập nhật thất bại: ' + (response?.message || 'Lỗi không xác định'), 'danger');
        }
    } catch (error) {
        console.error('Update task status error:', error);
        showToast('Lỗi khi cập nhật trạng thái', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
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
