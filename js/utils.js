export function showToast(message, type = 'danger') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    // Remove from DOM after hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

export const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// 格式化数字为越南盾格式（用于输入框显示）
export const formatMoneyInput = (value) => {
    if (!value) return '';
    // 移除所有非数字字符
    const numericValue = value.toString().replace(/\D/g, '');
    if (!numericValue) return '';
    // 格式化为越南盾
    return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue)) + ' ₫';
};

// 从格式化字符串中提取纯数字
export const parseMoneyInput = (formattedValue) => {
    if (!formattedValue) return '';
    // 移除所有非数字字符
    return formattedValue.toString().replace(/\D/g, '');
};

// --- Dark Mode Functions ---
export function initDarkMode() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Setup toggle button
    const toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleDarkMode);
        updateToggleIcon(savedTheme);
    }
}

export function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateToggleIcon(newTheme);
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function updateToggleIcon(theme) {
    const toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) {
        const sunIcon = toggleBtn.querySelector('.fa-sun');
        const moonIcon = toggleBtn.querySelector('.fa-moon');
        
        if (theme === 'dark') {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'inline-block';
        } else {
            if (sunIcon) sunIcon.style.display = 'inline-block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
    }
}