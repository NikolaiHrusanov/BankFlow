// ============================================
// app.js - Core Application Functionality
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize core features on all pages
    initThemeToggle();
    initPasswordToggle();
    initAuthToggle();
    initRegistration();
    protectRoutes();
    initSessionTimeout();
    initLogout();
    
    // Initialize page-specific features
    initDashboardFeatures();
    initTransactions();
    initTransfer();
});

// ============================================
// THEME TOGGLE (with localStorage)
// ============================================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    // Load saved theme
    const savedTheme = localStorage.getItem('nexusbank_theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.classList.add('light-theme');
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    themeToggle.addEventListener('click', function() {
        const html = document.documentElement;
        const icon = this.querySelector('i');
        
        if (html.classList.contains('dark-theme')) {
            html.classList.remove('dark-theme');
            html.classList.add('light-theme');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('nexusbank_theme', 'light');
        } else {
            html.classList.remove('light-theme');
            html.classList.add('dark-theme');
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('nexusbank_theme', 'dark');
        }
    });
}

// ============================================
// PASSWORD VISIBILITY TOGGLE (for all pages)
// ============================================
function initPasswordToggle() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.toggle-password')) {
            const button = e.target.closest('.toggle-password');
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        }
    });
}

// ============================================
// AUTH TOGGLE (LOGIN / REGISTER)
// ============================================
function initAuthToggle() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');

    if (showLoginBtn && showRegisterBtn && loginForm && registerForm) {
        showLoginBtn.addEventListener('click', function() {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            showLoginBtn.classList.add('active');
            showRegisterBtn.classList.remove('active');
        });

        showRegisterBtn.addEventListener('click', function() {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            showRegisterBtn.classList.add('active');
            showLoginBtn.classList.remove('active');
        });
    }
}

// ============================================
// REGISTRATION – VALIDATION & SUBMIT
// ============================================
function initRegistration() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    // ... (keep all your existing registration code here) ...
    // Copy the entire registration function from your original app.js
    // I'm not repeating it here to save space, but keep all the registration code
}

// ============================================
// PROTECT ROUTES – REDIRECT IF NOT LOGGED IN
// ============================================
function protectRoutes() {
    const protectedPages = ['dashboard.html', 'accounts.html', 'transfer.html', 'transactions.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        const user = JSON.parse(localStorage.getItem('nexusbank_current_user')) ||
                     JSON.parse(sessionStorage.getItem('nexusbank_current_user'));
        
        if (!user) {
            window.location.href = 'login.html';
        } else {
            // Display user name in header
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(el => {
                el.textContent = user.name;
            });
            
            // Display user email if needed
            const userEmailElements = document.querySelectorAll('.user-email');
            userEmailElements.forEach(el => {
                el.textContent = user.email;
            });
        }
    }
}

// ============================================
// SESSION TIMEOUT – AUTO LOGOUT AFTER 30 MIN
// ============================================
function initSessionTimeout() {
    const TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId;

    function resetTimer() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(logout, TIMEOUT);
    }

    function logout() {
        const protectedPages = ['dashboard.html', 'accounts.html', 'transfer.html', 'transactions.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            localStorage.removeItem('nexusbank_current_user');
            sessionStorage.removeItem('nexusbank_current_user');
            
            // Show warning before redirect
            const warning = document.createElement('div');
            warning.className = 'session-warning';
            warning.textContent = 'Your session has expired. You will be redirected to login.';
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 9999;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(warning);
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        }
    }

    // Events that reset the timer
    window.addEventListener('load', resetTimer);
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);
}

// ============================================
// DASHBOARD LOGOUT BUTTON
// ============================================
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear all session data
            localStorage.removeItem('nexusbank_current_user');
            sessionStorage.removeItem('nexusbank_current_user');
            
            // Redirect to login
            window.location.href = 'login.html';
        });
    }
}

// ============================================
// DASHBOARD SPECIFIC FEATURES
// ============================================
function initDashboardFeatures() {
    if (!document.getElementById('dashboardContent')) return;
    
    // Load dashboard data
    loadDashboardData();
    
    // Initialize charts if any
    initDashboardCharts();
}

function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('nexusbank_current_user')) ||
                 JSON.parse(sessionStorage.getItem('nexusbank_current_user'));
    
    if (user) {
        // Update welcome message
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) {
            welcomeEl.textContent = `Welcome back, ${user.name}!`;
        }
        
        // Load user's accounts data
        const accounts = JSON.parse(localStorage.getItem(`nexusbank_accounts_${user.id}`)) || [];
        updateAccountsDisplay(accounts);
    }
}

function updateAccountsDisplay(accounts) {
    // Update accounts list in dashboard
    const accountsList = document.getElementById('accountsList');
    if (accountsList && accounts.length > 0) {
        accountsList.innerHTML = accounts.map(account => `
            <div class="account-card">
                <div class="account-type">${account.type}</div>
                <div class="account-number">${account.number}</div>
                <div class="account-balance">$${account.balance.toLocaleString()}</div>
            </div>
        `).join('');
    }
}

function initDashboardCharts() {
    // Initialize any charts on dashboard
    const spendingChart = document.getElementById('spendingChart');
    if (spendingChart) {
        // Chart initialization code here
    }
}

// ============================================
// TRANSACTIONS PAGE FEATURES
// ============================================
function initTransactions() {
    if (!document.getElementById('transactionsContent')) return;
    
    loadTransactions();
    initTransactionFilters();
}

function loadTransactions() {
    const user = JSON.parse(localStorage.getItem('nexusbank_current_user')) ||
                 JSON.parse(sessionStorage.getItem('nexusbank_current_user'));
    
    if (user) {
        const transactions = JSON.parse(localStorage.getItem(`nexusbank_transactions_${user.id}`)) || [];
        displayTransactions(transactions);
    }
}

function displayTransactions(transactions) {
    const transactionsList = document.getElementById('transactionsList');
    if (transactionsList) {
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<p class="no-data">No transactions found.</p>';
        } else {
            transactionsList.innerHTML = transactions.map(t => `
                <div class="transaction-item ${t.type}">
                    <div class="transaction-date">${new Date(t.date).toLocaleDateString()}</div>
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-amount">${t.type === 'credit' ? '+' : '-'}$${t.amount}</div>
                </div>
            `).join('');
        }
    }
}

function initTransactionFilters() {
    const filterForm = document.getElementById('transactionFilters');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Apply filters and reload transactions
            loadTransactions();
        });
    }
}

// ============================================
// TRANSFER PAGE FEATURES
// ============================================
function initTransfer() {
    if (!document.getElementById('transferContent')) return;
    
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        transferForm.addEventListener('submit', handleTransfer);
    }
    
    loadAccountsForTransfer();
}

function handleTransfer(e) {
    e.preventDefault();
    
    const fromAccount = document.getElementById('fromAccount').value;
    const toAccount = document.getElementById('toAccount').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    
    if (!fromAccount || !toAccount || !amount || amount <= 0) {
        alert('Please fill all fields correctly.');
        return;
    }
    
    if (fromAccount === toAccount) {
        alert('Cannot transfer to the same account.');
        return;
    }
    
    // Process transfer
    const user = JSON.parse(localStorage.getItem('nexusbank_current_user')) ||
                 JSON.parse(sessionStorage.getItem('nexusbank_current_user'));
    
    if (user) {
        // Get user's accounts
        const accounts = JSON.parse(localStorage.getItem(`nexusbank_accounts_${user.id}`)) || [];
        const sourceAccount = accounts.find(a => a.number === fromAccount);
        
        if (sourceAccount && sourceAccount.balance >= amount) {
            // Update balances
            sourceAccount.balance -= amount;
            
            // Record transaction
            const transactions = JSON.parse(localStorage.getItem(`nexusbank_transactions_${user.id}`)) || [];
            transactions.unshift({
                date: new Date().toISOString(),
                type: 'debit',
                description: `Transfer to ${toAccount}: ${description || 'No description'}`,
                amount: amount
            });
            
            // Save changes
            localStorage.setItem(`nexusbank_accounts_${user.id}`, JSON.stringify(accounts));
            localStorage.setItem(`nexusbank_transactions_${user.id}`, JSON.stringify(transactions));
            
            alert('Transfer completed successfully!');
            window.location.reload();
        } else {
            alert('Insufficient funds.');
        }
    }
}

function loadAccountsForTransfer() {
    const user = JSON.parse(localStorage.getItem('nexusbank_current_user')) ||
                 JSON.parse(sessionStorage.getItem('nexusbank_current_user'));
    
    if (user) {
        const accounts = JSON.parse(localStorage.getItem(`nexusbank_accounts_${user.id}`)) || [];
        const fromAccountSelect = document.getElementById('fromAccount');
        const toAccountSelect = document.getElementById('toAccount');
        
        if (fromAccountSelect) {
            fromAccountSelect.innerHTML = accounts.map(a => 
                `<option value="${a.number}">${a.type} - ${a.number} ($${a.balance})</option>`
            ).join('');
        }
        
        if (toAccountSelect) {
            toAccountSelect.innerHTML = '<option value="">Select account</option>' +
                accounts.map(a => 
                    `<option value="${a.number}">${a.type} - ${a.number}</option>`
                ).join('');
        }
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .no-data {
        text-align: center;
        color: #666;
        padding: 40px;
        font-style: italic;
    }
`;
document.head.appendChild(style);