// ===== BANKING SYSTEM JS =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the banking application
    initBankingApp();
});

// ===== APP STATE =====
const bankData = {
    balance: 0,
    transactions: [],
    contactMessages: [],
    settings: {
        dailyDepositLimit: 25000,
        dailyWithdrawalLimit: 5000,
        minBalance: 10,
        maxDepositPerTransaction: 10000,
        sessionTimeout: 1800 // 30 minutes in seconds
    },
    stats: {
        lastBackup: null,
        totalTransactions: 0,
        monthlyStats: {}
    }
};

// ===== SESSION MANAGEMENT =====
let sessionTimer;
let sessionTimeLeft = bankData.settings.sessionTimeout;

// ===== INITIALIZE APP =====
function initBankingApp() {
    console.log('Initializing BankFlow Application...');
    
    // Initialize EmailJS (replace with your own public key)
    emailjs.init('YOUR_PUBLIC_KEY'); // You'll need to get this from EmailJS
    
    // Load data from localStorage
    loadDataFromStorage();
    
    // Setup all components
    setupNavigation();
    setupForms();
    setupFilters();
    setupQuickActions();
    setupButtons();
    setupModal();
    setupSessionTimer();
    setupQuickWithdrawals();
    setupDataManagement();
    
    // Update UI with loaded data
    updateUI();
    
    // Update current date in footer
    updateCurrentDate();
    
    console.log('BankFlow Application initialized successfully!');
}

// ===== LOCAL STORAGE FUNCTIONS =====
function loadDataFromStorage() {
    try {
        const savedData = localStorage.getItem('bankflow-data');
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Merge loaded data with defaults
            bankData.balance = parsedData.balance || 0;
            bankData.transactions = (parsedData.transactions || []).map(t => ({
                ...t,
                date: new Date(t.date)
            }));
            bankData.contactMessages = (parsedData.contactMessages || []).map(m => ({
                ...m,
                date: new Date(m.date)
            }));
            
            // Load settings if they exist
            if (parsedData.settings) {
                bankData.settings = { ...bankData.settings, ...parsedData.settings };
            }
            
            // Load stats if they exist
            if (parsedData.stats) {
                bankData.stats = { ...bankData.stats, ...parsedData.stats };
            }
            
            console.log('Data loaded from localStorage');
        } else {
            resetToDefaultData();
        }
    } catch (error) {
        console.error("Error loading saved data:", error);
        showToast('Error loading saved data. Resetting to defaults.', 'error');
        resetToDefaultData();
    }
}

function saveDataToStorage() {
    try {
        // Update stats before saving
        updateStats();
        
        localStorage.setItem('bankflow-data', JSON.stringify(bankData));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error("Error saving data:", error);
        showToast('Error saving data to browser storage', 'error');
    }
}

function resetToDefaultData() {
    console.log('Resetting to default data...');
    
    bankData.balance = 1250.75;
    bankData.transactions = [
        { 
            id: Date.now() - 3, 
            type: 'deposit', 
            amount: 1000, 
            description: 'Initial Deposit', 
            date: new Date('2023-10-01'), 
            balance: 1000 
        },
        { 
            id: Date.now() - 2, 
            type: 'deposit', 
            amount: 500, 
            description: 'Paycheck', 
            date: new Date('2023-10-05'), 
            balance: 1500 
        },
        { 
            id: Date.now() - 1, 
            type: 'withdraw', 
            amount: 249.25, 
            description: 'Grocery Shopping', 
            date: new Date('2023-10-07'), 
            balance: 1250.75 
        }
    ];
    
    bankData.contactMessages = [
        { 
            id: Date.now() - 4, 
            name: 'John Doe', 
            email: 'john@example.com', 
            subject: 'General Inquiry',
            message: 'I have a question about my account.', 
            date: new Date('2023-10-03') 
        }
    ];
    
    bankData.stats.lastBackup = null;
    
    saveDataToStorage();
}

// ===== STATS FUNCTIONS =====
function updateStats() {
    // Update total transactions count
    bankData.stats.totalTransactions = bankData.transactions.length;
    
    // Calculate monthly stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyTransactions = bankData.transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
    
    bankData.stats.monthlyStats = {
        totalAmount: monthlyTransactions.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0),
        depositCount: monthlyTransactions.filter(t => t.type === 'deposit').length,
        withdrawalCount: monthlyTransactions.filter(t => t.type === 'withdraw').length,
        averageTransaction: monthlyTransactions.length > 0 
            ? monthlyTransactions.reduce((sum, t) => sum + t.amount, 0) / monthlyTransactions.length
            : 0,
        largestTransaction: monthlyTransactions.length > 0
            ? Math.max(...monthlyTransactions.map(t => t.amount))
            : 0
    };
}

// ===== LIMIT CALCULATIONS =====
function getTodayDeposits() {
    const today = new Date().toDateString();
    return bankData.transactions
        .filter(t => t.type === 'deposit' && 
                     new Date(t.date).toDateString() === today)
        .reduce((sum, t) => sum + t.amount, 0);
}

function getTodayWithdrawals() {
    const today = new Date().toDateString();
    return bankData.transactions
        .filter(t => t.type === 'withdraw' && 
                     new Date(t.date).toDateString() === today)
        .reduce((sum, t) => sum + t.amount, 0);
}

function canDeposit(amount) {
    const todayDeposits = getTodayDeposits();
    return todayDeposits + amount <= bankData.settings.dailyDepositLimit;
}

function canWithdraw(amount) {
    const todayWithdrawals = getTodayWithdrawals();
    return todayWithdrawals + amount <= bankData.settings.dailyWithdrawalLimit;
}

// ===== BANKING FUNCTIONS =====
function deposit(amount, description = 'Deposit') {
    amount = parseFloat(amount);
    
    // Validation
    const validation = validateTransaction(amount, 'deposit');
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return false;
    }
    
    // Check daily limit
    if (!canDeposit(amount)) {
        const todayDeposits = getTodayDeposits();
        const remaining = bankData.settings.dailyDepositLimit - todayDeposits;
        showToast(`Daily deposit limit exceeded. You can deposit up to $${remaining.toFixed(2)} more today.`, 'error');
        return false;
    }
    
    // Round to 2 decimal places
    amount = Math.round(amount * 100) / 100;
    
    // Update balance
    bankData.balance += amount;
    bankData.balance = Math.round(bankData.balance * 100) / 100;
    
    // Create transaction record
    const transaction = {
        id: Date.now(),
        type: 'deposit',
        amount: amount,
        description: description,
        date: new Date(),
        balance: bankData.balance
    };
    
    // Add to transactions
    bankData.transactions.unshift(transaction);
    
    // Reset session timer
    resetSessionTimer();
    
    // Save to localStorage
    saveDataToStorage();
    
    // Update UI
    updateUI();
    
    // Show success message
    showToast(`Successfully deposited $${amount.toFixed(2)}`, 'success');
    
    return true;
}

function withdraw(amount, description = 'Withdrawal') {
    amount = parseFloat(amount);
    
    // Validation
    const validation = validateTransaction(amount, 'withdraw');
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return false;
    }
    
    // Check daily limit
    if (!canWithdraw(amount)) {
        const todayWithdrawals = getTodayWithdrawals();
        const remaining = bankData.settings.dailyWithdrawalLimit - todayWithdrawals;
        showToast(`Daily withdrawal limit exceeded. You can withdraw up to $${remaining.toFixed(2)} more today.`, 'error');
        return false;
    }
    
    // Round to 2 decimal places
    amount = Math.round(amount * 100) / 100;
    
    // Check minimum balance after withdrawal
    if (bankData.balance - amount < bankData.settings.minBalance) {
        showToast(`Account must maintain a minimum balance of $${bankData.settings.minBalance.toFixed(2)}`, 'error');
        return false;
    }
    
    // Update balance
    bankData.balance -= amount;
    bankData.balance = Math.round(bankData.balance * 100) / 100;
    
    // Create transaction record
    const transaction = {
        id: Date.now(),
        type: 'withdraw',
        amount: amount,
        description: description,
        date: new Date(),
        balance: bankData.balance
    };
    
    // Add to transactions
    bankData.transactions.unshift(transaction);
    
    // Reset session timer
    resetSessionTimer();
    
    // Save to localStorage
    saveDataToStorage();
    
    // Update UI
    updateUI();
    
    // Show success message
    showToast(`Successfully withdrew $${amount.toFixed(2)}`, 'success');
    
    return true;
}

function validateTransaction(amount, type) {
    if (isNaN(amount) || amount <= 0) {
        return { valid: false, message: 'Please enter a valid amount' };
    }
    
    amount = Math.round(amount * 100) / 100;
    
    if (type === 'deposit') {
        if (amount > bankData.settings.maxDepositPerTransaction) {
            return { valid: false, message: `Maximum deposit amount is $${bankData.settings.maxDepositPerTransaction.toFixed(2)} per transaction` };
        }
    } else if (type === 'withdraw') {
        if (amount > bankData.balance) {
            return { valid: false, message: 'Insufficient funds for this withdrawal' };
        }
    }
    
    return { valid: true, message: '' };
}

// ===== UI UPDATE FUNCTIONS =====
function updateUI() {
    updateBalanceDisplay();
    updateTransactionTotals();
    updateRecentTransactions();
    updateTransactionsList();
    updateTransactionSummary();
    updateContactMessages();
    updateLimitBars();
    updateStatsDisplay();
}

function updateBalanceDisplay() {
    const elements = {
        'current-balance': bankData.balance.toFixed(2),
        'deposit-balance-preview': bankData.balance.toFixed(2),
        'withdraw-balance-preview': bankData.balance.toFixed(2),
        'max-withdrawal': Math.max(0, bankData.balance - bankData.settings.minBalance).toFixed(2),
        'today-deposits': getTodayDeposits().toFixed(2),
        'today-withdrawals': getTodayWithdrawals().toFixed(2),
        'transaction-count': bankData.transactions.length,
        'total-transactions-count': bankData.transactions.length
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function updateTransactionTotals() {
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    bankData.transactions.forEach(transaction => {
        if (transaction.type === 'deposit') {
            totalDeposits += transaction.amount;
        } else if (transaction.type === 'withdraw') {
            totalWithdrawals += transaction.amount;
        }
    });
    
    totalDeposits = Math.round(totalDeposits * 100) / 100;
    totalWithdrawals = Math.round(totalWithdrawals * 100) / 100;
    
    const totalDepositsElement = document.getElementById('total-deposits');
    const totalWithdrawalsElement = document.getElementById('total-withdrawals');
    
    if (totalDepositsElement) totalDepositsElement.textContent = totalDeposits.toFixed(2);
    if (totalWithdrawalsElement) totalWithdrawalsElement.textContent = totalWithdrawals.toFixed(2);
}

function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    if (!container) return;
    
    container.innerHTML = '';
    
    const recentTransactions = bankData.transactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions yet. Make your first deposit!</p>';
        return;
    }
    
    recentTransactions.forEach(transaction => {
        const transactionElement = createTransactionElement(transaction, 'recent');
        container.appendChild(transactionElement);
    });
}

function updateTransactionsList(filterType = 'all', sortBy = 'newest', page = 1) {
    const container = document.getElementById('transactions-list');
    if (!container) return;
    
    // Filter transactions
    let filteredTransactions = [...bankData.transactions];
    
    if (filterType !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
    }
    
    // Sort transactions
    filteredTransactions.sort((a, b) => {
        switch (sortBy) {
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'amount-high':
                return b.amount - a.amount;
            case 'amount-low':
                return a.amount - b.amount;
            case 'newest':
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });
    
    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // Update pagination controls
    updatePaginationControls(page, totalPages);
    
    // Clear and update container
    container.innerHTML = '';
    
    if (paginatedTransactions.length === 0) {
        container.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">No transactions found.</td>
            </tr>
        `;
        return;
    }
    
    paginatedTransactions.forEach(transaction => {
        const row = createTransactionRow(transaction);
        container.appendChild(row);
    });
}

function createTransactionElement(transaction, type = 'list') {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    const dateFormatted = new Date(transaction.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    const amountClass = transaction.type === 'deposit' ? 'deposit-amount' : 'withdraw-amount';
    const amountSign = transaction.type === 'deposit' ? '+' : '-';
    
    if (type === 'recent') {
        div.innerHTML = `
            <div class="transaction-info">
                <h4>${transaction.description}</h4>
                <p>${dateFormatted}</p>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${amountSign}$${transaction.amount.toFixed(2)}
            </div>
        `;
    }
    
    return div;
}

function createTransactionRow(transaction) {
    const row = document.createElement('tr');
    
    const dateFormatted = new Date(transaction.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    const timeFormatted = new Date(transaction.date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const typeClass = transaction.type === 'deposit' ? 'type-deposit' : 'type-withdraw';
    const typeText = transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal';
    const amountSign = transaction.type === 'deposit' ? '+' : '-';
    
    row.innerHTML = `
        <td>${dateFormatted}<br><small>${timeFormatted}</small></td>
        <td>${transaction.description}</td>
        <td><span class="transaction-type ${typeClass}">${typeText}</span></td>
        <td>${amountSign}$${transaction.amount.toFixed(2)}</td>
        <td>$${transaction.balance.toFixed(2)}</td>
        <td><small>${transaction.id.toString().slice(-6)}</small></td>
    `;
    
    return row;
}

function updatePaginationControls(currentPage, totalPages) {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const currentPageElement = document.getElementById('current-page');
    const totalPagesElement = document.getElementById('total-pages');
    
    if (prevButton) prevButton.disabled = currentPage <= 1;
    if (nextButton) nextButton.disabled = currentPage >= totalPages;
    if (currentPageElement) currentPageElement.textContent = currentPage;
    if (totalPagesElement) totalPagesElement.textContent = totalPages;
}

function updateTransactionSummary() {
    const depositValueElement = document.querySelector('.deposit-value');
    const withdrawValueElement = document.querySelector('.withdraw-value');
    const netValueElement = document.querySelector('.net-value');
    
    const totalDeposits = bankData.transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = bankData.transactions
        .filter(t => t.type === 'withdraw')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const netChange = totalDeposits - totalWithdrawals;
    
    if (depositValueElement) depositValueElement.textContent = `$${totalDeposits.toFixed(2)}`;
    if (withdrawValueElement) withdrawValueElement.textContent = `$${totalWithdrawals.toFixed(2)}`;
    if (netValueElement) netValueElement.textContent = `$${netChange.toFixed(2)}`;
}

function updateStatsDisplay() {
    updateStats();
    
    const monthlyStats = bankData.stats.monthlyStats;
    
    const elements = {
        'this-month-total': `$${monthlyStats.totalAmount.toFixed(2)}`,
        'avg-transaction': `$${monthlyStats.averageTransaction.toFixed(2)}`,
        'largest-transaction': `$${monthlyStats.largestTransaction.toFixed(2)}`
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function updateLimitBars() {
    const todayDeposits = getTodayDeposits();
    const todayWithdrawals = getTodayWithdrawals();
    
    const depositLimitPercent = (todayDeposits / bankData.settings.dailyDepositLimit) * 100;
    const withdrawalLimitPercent = (todayWithdrawals / bankData.settings.dailyWithdrawalLimit) * 100;
    
    const depositFill = document.getElementById('deposit-limit-fill');
    const withdrawalFill = document.getElementById('withdrawal-limit-fill');
    
    if (depositFill) depositFill.style.width = `${Math.min(depositLimitPercent, 100)}%`;
    if (withdrawalFill) withdrawalFill.style.width = `${Math.min(withdrawalLimitPercent, 100)}%`;
}

function updateContactMessages() {
    const container = document.getElementById('contact-messages');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (bankData.contactMessages.length === 0) {
        container.innerHTML = '<p class="empty-state">No messages sent yet.</p>';
        return;
    }
    
    const recentMessages = bankData.contactMessages.slice(0, 3);
    
    recentMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        
        const dateFormatted = new Date(message.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${message.name}</span>
                <span class="message-date">${dateFormatted}</span>
            </div>
            <div class="message-content">
                <strong>${message.subject}</strong><br>
                ${message.message}
            </div>
        `;
        
        container.appendChild(messageElement);
    });
}

function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// ===== FORM HANDLING =====
function setupForms() {
    // Deposit form
    const depositForm = document.getElementById('deposit-form');
    if (depositForm) {
        depositForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amountInput = document.getElementById('deposit-amount');
            const descriptionInput = document.getElementById('deposit-description');
            
            const amount = parseFloat(amountInput.value);
            const description = descriptionInput.value.trim() || 'Deposit';
            
            // Check for large transactions
            if (amount > 1000) {
                showConfirmationModal(
                    `Deposit $${amount.toFixed(2)}?`,
                    `Are you sure you want to deposit $${amount.toFixed(2)} into your account?`,
                    () => {
                        if (deposit(amount, description)) {
                            depositForm.reset();
                            navigateToSection('#dashboard');
                        }
                    }
                );
            } else {
                if (deposit(amount, description)) {
                    depositForm.reset();
                    navigateToSection('#dashboard');
                }
            }
        });
    }
    
    // Withdraw form
    const withdrawForm = document.getElementById('withdraw-form');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amountInput = document.getElementById('withdraw-amount');
            const descriptionInput = document.getElementById('withdraw-description');
            
            const amount = parseFloat(amountInput.value);
            const description = descriptionInput.value.trim() || 'Withdrawal';
            
            // Check for large transactions
            if (amount > 500) {
                showConfirmationModal(
                    `Withdraw $${amount.toFixed(2)}?`,
                    `Are you sure you want to withdraw $${amount.toFixed(2)} from your account?`,
                    () => {
                        if (withdraw(amount, description)) {
                            withdrawForm.reset();
                            navigateToSection('#dashboard');
                        }
                    }
                );
            } else {
                if (withdraw(amount, description)) {
                    withdrawForm.reset();
                    navigateToSection('#dashboard');
                }
            }
        });
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('contact-name');
            const emailInput = document.getElementById('contact-email');
            const subjectInput = document.getElementById('contact-subject');
            const messageInput = document.getElementById('contact-message');
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const subject = subjectInput.value;
            const message = messageInput.value.trim();
            
            // Validation
            if (!name || !email || !subject || !message) {
                showToast('Please fill in all required fields', 'error');
                return;
            }
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            
            // Create message record
            const messageRecord = {
                id: Date.now(),
                name: name,
                email: email,
                subject: subject,
                message: message,
                date: new Date()
            };
            
            // Add to messages
            bankData.contactMessages.unshift(messageRecord);
            
            // Save to localStorage
            saveDataToStorage();
            
            // Send email via EmailJS (requires setup)
            sendEmailViaEmailJS(name, email, subject, message);
            
            // Reset session timer
            resetSessionTimer();
            
            // Update UI
            updateContactMessages();
            
            // Show success message
            showToast('Your message has been sent successfully!', 'success');
            
            // Reset form
            contactForm.reset();
        });
    }
    
    // Cancel buttons
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            navigateToSection('#dashboard');
        });
    });
}

// ===== EMAIL FUNCTIONALITY =====
function sendEmailViaEmailJS(name, email, subject, message) {
    const templateParams = {
        from_name: name,
        from_email: email,
        subject: subject,
        message: message,
        to_email: 'support@bankflow.com'
    };
    
    // Note: You need to set up EmailJS service and template
    // emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
    //     .then(function(response) {
    //         console.log('Email sent successfully!', response);
    //     }, function(error) {
    //         console.error('Email sending failed:', error);
    //         showToast('Message saved locally but email sending failed.', 'info');
    //     });
    
    console.log('Email would be sent with:', templateParams);
}

// ===== BUTTON SETUP =====
function setupButtons() {
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Export CSV button
    const exportCSVBtn = document.getElementById('export-transactions');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportToCSV);
    }
    
    // Clear transaction history
    const clearHistoryBtn = document.getElementById('clear-transaction-history');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            showConfirmationModal(
                'Clear Transaction History',
                'Are you sure you want to clear all transaction history? This action cannot be undone.',
                clearTransactionHistory
            );
        });
    }
    
    // Clear contact messages
    const clearMessagesBtn = document.getElementById('clear-messages');
    if (clearMessagesBtn) {
        clearMessagesBtn.addEventListener('click', function() {
            showConfirmationModal(
                'Clear Messages',
                'Are you sure you want to clear all contact messages?',
                clearContactMessages
            );
        });
    }
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            const currentPage = parseInt(document.getElementById('current-page').textContent);
            if (currentPage > 1) {
                updateTransactionsList(
                    document.getElementById('transaction-filter-type').value,
                    document.getElementById('transaction-sort').value,
                    currentPage - 1
                );
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const currentPage = parseInt(document.getElementById('current-page').textContent);
            const totalPages = parseInt(document.getElementById('total-pages').textContent);
            if (currentPage < totalPages) {
                updateTransactionsList(
                    document.getElementById('transaction-filter-type').value,
                    document.getElementById('transaction-sort').value,
                    currentPage + 1
                );
            }
        });
    }
}

function setupQuickWithdrawals() {
    const quickAmounts = document.querySelectorAll('.quick-amount');
    quickAmounts.forEach(button => {
        button.addEventListener('click', function() {
            const amount = parseFloat(this.getAttribute('data-amount'));
            const amountInput = document.getElementById('withdraw-amount');
            if (amountInput) {
                amountInput.value = amount;
                amountInput.focus();
            }
        });
    });
}

// ===== DATA MANAGEMENT =====
function setupDataManagement() {
    // Import data button
    const importBtn = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');
    
    if (importBtn && importFile) {
        importBtn.addEventListener('click', function() {
            importFile.click();
        });
        
        importFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                importData(file);
            }
            this.value = ''; // Reset file input
        });
    }
    
    // Reset all data button
    const resetBtn = document.getElementById('reset-all-data');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            showConfirmationModal(
                'Reset All Data',
                'Are you sure you want to reset ALL data? This will clear everything and cannot be undone.',
                function() {
                    localStorage.removeItem('bankflow-data');
                    resetToDefaultData();
                    updateUI();
                    navigateToSection('#dashboard');
                    showToast('All data has been reset to defaults', 'success');
                }
            );
        });
    }
    
    // Backup data button
    const backupBtn = document.getElementById('backup-data');
    if (backupBtn) {
        backupBtn.addEventListener('click', function() {
            backupData();
        });
    }
    
    // Update last backup display
    const lastBackupElement = document.getElementById('last-backup');
    if (lastBackupElement && bankData.stats.lastBackup) {
        lastBackupElement.textContent = new Date(bankData.stats.lastBackup).toLocaleString();
    }
}

// ===== EXPORT/IMPORT FUNCTIONS =====
function exportData() {
    const dataStr = JSON.stringify(bankData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `bankflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    showToast('Data exported successfully', 'success');
}

function exportToCSV() {
    if (bankData.transactions.length === 0) {
        showToast('No transactions to export', 'info');
        return;
    }
    
    let csv = 'Date,Description,Type,Amount,Balance,ID\n';
    
    bankData.transactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString();
        const description = `"${transaction.description.replace(/"/g, '""')}"`;
        const type = transaction.type;
        const amount = transaction.amount.toFixed(2);
        const balance = transaction.balance.toFixed(2);
        const id = transaction.id;
        
        csv += `${date},${description},${type},${amount},${balance},${id}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bankflow-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Transactions exported to CSV successfully', 'success');
}

function importData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data structure
            if (!importedData.balance || !importedData.transactions) {
                throw new Error('Invalid data format');
            }
            
            // Show confirmation modal
            showConfirmationModal(
                'Import Data',
                `This will replace all current data with imported data. 
                This includes ${importedData.transactions.length} transactions.
                Are you sure you want to continue?`,
                function() {
                    // Update bankData
                    bankData.balance = importedData.balance;
                    bankData.transactions = importedData.transactions.map(t => ({
                        ...t,
                        date: new Date(t.date)
                    }));
                    bankData.contactMessages = (importedData.contactMessages || []).map(m => ({
                        ...m,
                        date: new Date(m.date)
                    }));
                    
                    if (importedData.settings) {
                        bankData.settings = { ...bankData.settings, ...importedData.settings };
                    }
                    
                    if (importedData.stats) {
                        bankData.stats = { ...bankData.stats, ...importedData.stats };
                    }
                    
                    // Save to localStorage
                    saveDataToStorage();
                    
                    // Update UI
                    updateUI();
                    
                    showToast('Data imported successfully', 'success');
                }
            );
        } catch (error) {
            console.error('Import error:', error);
            showToast('Error importing data: Invalid file format', 'error');
        }
    };
    
    reader.readAsText(file);
}

function backupData() {
    bankData.stats.lastBackup = new Date();
    saveDataToStorage();
    
    const lastBackupElement = document.getElementById('last-backup');
    if (lastBackupElement) {
        lastBackupElement.textContent = new Date().toLocaleString();
    }
    
    showToast('Data backup created successfully', 'success');
}

// ===== CLEAR FUNCTIONS =====
function clearTransactionHistory() {
    bankData.transactions = [];
    saveDataToStorage();
    updateUI();
    showToast('Transaction history cleared', 'success');
}

function clearContactMessages() {
    bankData.contactMessages = [];
    saveDataToStorage();
    updateUI();
    showToast('Contact messages cleared', 'success');
}

// ===== NAVIGATION =====
function setupNavigation() {
    // Navbar links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            navigateToSection(targetId);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Hamburger menu for mobile
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

function setupQuickActions() {
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                navigateToSection(targetId);
                
                // Update active nav link
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === targetId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

function navigateToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.querySelector(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Reset session timer
        resetSessionTimer();
        
        // Scroll to top of section
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// ===== FILTERS & SORTING =====
function setupFilters() {
    const filterSelect = document.getElementById('transaction-filter-type');
    const sortSelect = document.getElementById('transaction-sort');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            updateTransactionsList(
                this.value,
                sortSelect ? sortSelect.value : 'newest',
                1
            );
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            updateTransactionsList(
                filterSelect ? filterSelect.value : 'all',
                this.value,
                1
            );
        });
    }
}

// ===== MODAL SYSTEM =====
function setupModal() {
    const modal = document.getElementById('confirmation-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    
    if (modalClose) {
        modalClose.addEventListener('click', hideModal);
    }
    
    if (modalCancel) {
        modalCancel.addEventListener('click', hideModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideModal();
        }
    });
}

let confirmCallback = null;

function showConfirmationModal(title, message, callback) {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = modal.querySelector('.modal-header h3');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmCallback = callback;
    
    // Remove previous event listener
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', function() {
        if (confirmCallback) {
            confirmCallback();
        }
        hideModal();
    });
    
    modal.classList.add('show');
}

function hideModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('show');
    confirmCallback = null;
}

// ===== SESSION TIMER =====
function setupSessionTimer() {
    const timerElement = document.getElementById('session-timer');
    if (!timerElement) return;
    
    // Reset timer on user interaction
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, resetSessionTimer);
    });
    
    startSessionTimer();
}

function startSessionTimer() {
    clearInterval(sessionTimer);
    
    sessionTimer = setInterval(() => {
        sessionTimeLeft--;
        
        updateTimerDisplay();
        
        if (sessionTimeLeft <= 0) {
            clearInterval(sessionTimer);
            handleSessionTimeout();
        }
    }, 1000);
}

function resetSessionTimer() {
    sessionTimeLeft = bankData.settings.sessionTimeout;
    updateTimerDisplay();
    startSessionTimer();
}

function updateTimerDisplay() {
    const minutes = Math.floor(sessionTimeLeft / 60);
    const seconds = sessionTimeLeft % 60;
    
    const minutesElement = document.getElementById('timer-minutes');
    const secondsElement = document.getElementById('timer-seconds');
    
    if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
    if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
    
    // Change color when time is running low
    const timerElement = document.getElementById('session-timer');
    if (timerElement) {
        if (sessionTimeLeft < 300) { // Less than 5 minutes
            timerElement.style.background = 'rgba(220, 53, 69, 0.9)';
        } else if (sessionTimeLeft < 600) { // Less than 10 minutes
            timerElement.style.background = 'rgba(255, 193, 7, 0.9)';
        } else {
            timerElement.style.background = 'rgba(0, 0, 0, 0.8)';
        }
    }
}

function handleSessionTimeout() {
    showToast('Session expired due to inactivity. Please refresh the page.', 'error');
    
    // Disable all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.querySelectorAll('input, button, textarea, select').forEach(element => {
            element.disabled = true;
        });
    });
    
    // Show timeout message
    const timerElement = document.getElementById('session-timer');
    if (timerElement) {
        timerElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Session Expired';
        timerElement.style.background = 'rgba(220, 53, 69, 0.9)';
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    const toastClose = toast.querySelector('.toast-close');
    
    if (!toast || !toastIcon || !toastMessage) return;
    
    // Set message and type
    toastMessage.textContent = message;
    
    // Set icon based on type
    let iconClass = '';
    if (type === 'success') {
        iconClass = 'fas fa-check-circle';
        toast.className = 'toast toast-success';
    } else if (type === 'error') {
        iconClass = 'fas fa-exclamation-circle';
        toast.className = 'toast toast-error';
    } else {
        iconClass = 'fas fa-info-circle';
        toast.className = 'toast toast-info';
    }
    
    toastIcon.className = `toast-icon ${iconClass}`;
    
    // Remove previous event listeners
    const newToastClose = toastClose.cloneNode(true);
    toastClose.parentNode.replaceChild(newToastClose, toastClose);
    
    // Add close button functionality
    newToastClose.addEventListener('click', function() {
        toast.classList.remove('show');
    });
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// ===== WINDOW UNLOAD WARNING =====
window.addEventListener('beforeunload', function(e) {
    // Check if there are unsaved changes (for forms)
    const depositForm = document.getElementById('deposit-form');
    const withdrawForm = document.getElementById('withdraw-form');
    const contactForm = document.getElementById('contact-form');
    
    const hasUnsavedChanges = 
        (depositForm && Array.from(depositForm.elements).some(el => el.value && !el.disabled)) ||
        (withdrawForm && Array.from(withdrawForm.elements).some(el => el.value && !el.disabled)) ||
        (contactForm && Array.from(contactForm.elements).some(el => el.value && !el.disabled));
    
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// ===== INITIAL DATA CHECK =====
// Check if this is first visit
if (!localStorage.getItem('bankflow-first-visit')) {
    showToast('Welcome to BankFlow! This is a demo banking application. Data is stored locally in your browser.', 'info');
    localStorage.setItem('bankflow-first-visit', 'true');
}

// ===== ERROR HANDLING =====
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', { message, source, lineno, colno, error });
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
    return false;
};

// ===== PUBLIC API (for browser console testing) =====
window.BankFlow = {
    getBalance: () => bankData.balance,
    getTransactions: () => bankData.transactions,
    deposit: deposit,
    withdraw: withdraw,
    resetData: resetToDefaultData,
    exportData: exportData,
    showToast: showToast
};

console.log('BankFlow API available at window.BankFlow');
// Add these functions to your existing JavaScript

// ===== MODERN LAYOUT FUNCTIONS =====

function initModernLayout() {
    // Add smooth transitions between sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    // Add parallax effect to welcome card
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const welcomeCard = document.querySelector('.welcome-card');
        if (welcomeCard) {
            welcomeCard.style.transform = `translateY(${scrolled * 0.05}px)`;
        }
    });
    
    // Initialize animated charts
    initAnimatedCharts();
    
    // Add hover effects to cards
    initCardHoverEffects();
    
    // Initialize quick amount buttons
    initQuickAmountButtons();
    
    // Add loading animations
    initLoadingAnimations();
}

function initAnimatedCharts() {
    // Animate chart bars on scroll into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.bar');
                bars.forEach((bar, index) => {
                    const height = bar.style.height;
                    bar.style.height = '0%';
                    setTimeout(() => {
                        bar.style.height = height;
                    }, index * 100);
                });
            }
        });
    }, { threshold: 0.5 });
    
    const chart = document.querySelector('.spending-chart');
    if (chart) observer.observe(chart);
}

function initCardHoverEffects() {
    // Add 3D tilt effect to cards
    document.querySelectorAll('.action-card, .mini-card, .account-card').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateY = ((x - centerX) / centerX) * 5;
            const rotateX = ((centerY - y) / centerY) * 5;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

function initQuickAmountButtons() {
    // Handle quick amount button clicks
    document.querySelectorAll('.quick-amount-btn').forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.textContent.replace('$', '');
            const amountInput = document.querySelector('.amount-input-modern');
            if (amountInput) {
                amountInput.value = amount;
                amountInput.focus();
                
                // Add animation feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            }
        });
    });
}

function initLoadingAnimations() {
    // Simulate data loading with skeleton screens
    const simulateLoading = () => {
        document.querySelectorAll('.loading-placeholder').forEach(placeholder => {
            placeholder.classList.add('loading');
            setTimeout(() => {
                placeholder.classList.remove('loading');
                placeholder.style.opacity = '1';
            }, 1000);
        });
    };
    
    // Run on page load
    setTimeout(simulateLoading, 500);
}

// ===== REAL-TIME UPDATES =====
function updateRealTimeStats() {
    // Update time dynamically
    setInterval(() => {
        const timeElement = document.querySelector('.stat-value:contains("Today")');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            timeElement.textContent = `Today, ${timeString}`;
        }
    }, 60000); // Update every minute
    
    // Simulate live balance updates
    setInterval(() => {
        const balanceElement = document.getElementById('current-balance');
        if (balanceElement) {
            const balance = parseFloat(balanceElement.textContent.replace(/,/g, ''));
            const change = (Math.random() - 0.5) * 10; // Random small change
            const newBalance = balance + change;
            balanceElement.textContent = newBalance.toFixed(2);
            
            // Update change indicator
            const changeElement = document.querySelector('.balance-change');
            if (changeElement) {
                changeElement.textContent = `${change >= 0 ? '+' : ''}$${change.toFixed(2)}`;
                changeElement.className = `balance-change ${change >= 0 ? 'positive' : 'negative'}`;
            }
        }
    }, 5000); // Update every 5 seconds
}

// ===== MODERN NOTIFICATIONS =====
function showModernNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `modern-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// ===== DARK MODE TOGGLE =====
function initDarkModeToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'dark-mode-toggle';
    toggle.innerHTML = `
        <input type="checkbox" id="dark-mode-switch">
        <label for="dark-mode-switch">
            <i class="fas fa-moon"></i>
            <i class="fas fa-sun"></i>
            <span class="toggle-ball"></span>
        </label>
    `;
    
    // Add to navbar
    const navbar = document.querySelector('.nav-container');
    if (navbar) {
        navbar.appendChild(toggle);
    }
    
    // Handle toggle
    const switchInput = toggle.querySelector('#dark-mode-switch');
    switchInput.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode', this.checked);
        localStorage.setItem('darkMode', this.checked);
    });
    
    // Load saved preference
    const savedMode = localStorage.getItem('darkMode') === 'true';
    switchInput.checked = savedMode;
    document.body.classList.toggle('dark-mode', savedMode);
}

// ===== INITIALIZE MODERN FEATURES =====
document.addEventListener('DOMContentLoaded', function() {
    // Add after existing init code
    initModernLayout();
    updateRealTimeStats();
    initDarkModeToggle();
    
    // Update dashboard with real data
    updateModernDashboard();
});

function updateModernDashboard() {
    // Update welcome card with user data
    const userName = localStorage.getItem('bankflow-user') || 'Alex Johnson';
    document.querySelector('.user-name').textContent = userName;
    
    // Update mini cards with real data
    const monthlyIncome = bankData.transactions
        .filter(t => t.type === 'deposit')
        .filter(t => {
            const tDate = new Date(t.date);
            const now = new Date();
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = bankData.transactions
        .filter(t => t.type === 'withdraw')
        .filter(t => {
            const tDate = new Date(t.date);
            const now = new Date();
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    document.querySelector('.mini-card.income .mini-card-value').textContent = 
        `$${monthlyIncome.toFixed(2)}`;
    document.querySelector('.mini-card.expenses .mini-card-value').textContent = 
        `$${monthlyExpenses.toFixed(2)}`;
}