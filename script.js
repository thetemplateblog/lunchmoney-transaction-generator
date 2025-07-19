/**
 * LunchMoney Transaction Generator - JavaScript Client
 * Generates realistic recurring transactions for testing purposes
 */

class LunchMoneyAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://dev.lunchmoney.app/v1';
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
            console.log('Making ' + config.method + ' request to ' + url);
            console.log('Request body:', config.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error ' + response.status + ':', errorText);
                throw new Error('HTTP ' + response.status + ': ' + errorText);
            }

            const result = await response.json();
            console.log('API Response:', result);
            return result;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async getUser() {
        return await this.makeRequest('me');
    }

    async getAssets() {
        return await this.makeRequest('assets');
    }

    async getCategories() {
        return await this.makeRequest('categories');
    }

    async createCategory(name, isIncome = false) {
        return await this.makeRequest('categories', {
            method: 'POST',
            body: { name, is_income: isIncome }
        });
    }

    async createAsset(assetData) {
        return await this.makeRequest('assets', {
            method: 'POST',
            body: assetData
        });
    }

    async getTransactions(startDate, endDate) {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate
        });
        return await this.makeRequest(`transactions?${params}`);
    }

    async createTransactions(transactions) {
        return await this.makeRequest('transactions', {
            method: 'POST',
            body: {
                transactions,
                apply_rules: true,
                check_for_recurring: true,
                debit_as_negative: true
            }
        });
    }
}

class TransactionGenerator {
    constructor() {
        this.api = null;
        this.accountId = null;
        this.categories = {};
        this.progressCallback = null;
        
        this.recurringTransactions = [
            // Income
            { payee: "ABC Company", amount: 3250.00, day: 1, category: "Income", notes: "Salary Deposit" },
            { payee: "Freelance Client", amount: 825.50, day: 15, category: "Income", notes: "Freelance Payment" },
            
            // Expenses
            { payee: "Oakwood Properties", amount: -1450.00, day: 3, category: "Housing", notes: "Rent Payment" },
            { payee: "Speedy Internet", amount: -79.99, day: 7, category: "Utilities", notes: "Internet Bill" },
            { payee: "MobileTalk", amount: -85.25, day: 12, category: "Utilities", notes: "Phone Bill" },
            { payee: "FitLife Gym", amount: -45.00, day: 18, category: "Subscriptions", notes: "Gym Membership" },
            { payee: "StreamFlix", amount: -19.99, day: 21, category: "Entertainment", notes: "Streaming Service" },
            { payee: "EdFinance", amount: -315.75, day: 24, category: "Education", notes: "Student Loan Payment" },
            { payee: "Safe Auto", amount: -135.50, day: 27, category: "Transportation", notes: "Car Insurance" },
            { payee: "Savings Account", amount: -200.00, day: 30, category: "Savings", notes: "Savings Transfer" }
        ];
    }

    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    updateProgress(step, message, percentage = 0) {
        if (this.progressCallback) {
            this.progressCallback(step, message, percentage);
        }
    }

    async validateApiKey(apiKey) {
        try {
            this.api = new LunchMoneyAPI(apiKey);
            const user = await this.api.getUser();
            return { valid: true, user };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    async checkAccountEmpty() {
        try {
            const currentDate = new Date();
            const pastDate = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            
            const transactions = await this.api.getTransactions(
                pastDate.toISOString().split('T')[0],
                currentDate.toISOString().split('T')[0]
            );
            
            const transactionCount = transactions.transactions?.length || 0;
            return {
                empty: transactionCount === 0,
                count: transactionCount
            };
        } catch (error) {
            console.error('Failed to check account status:', error);
            return { empty: false, count: -1, error: error.message };
        }
    }

    async setupAccountAndCategories(selectedAccounts = [{type: 'checking', balance: 5000}, {type: 'savings', balance: 15000}, {type: 'credit', balance: -850}, {type: 'investment', balance: 25000}]) {
        this.updateProgress('setup', 'Getting account information...', 10);
        
        // Get existing accounts
        const assets = await this.api.getAssets();
        let checkingAccount = null;
        
        // Look for existing checking account
        for (const asset of assets.assets || []) {
            if (asset.type_name === 'cash' && asset.name.toLowerCase().includes('checking')) {
                checkingAccount = asset;
                break;
            }
        }
        
        // Create selected accounts that don't exist
        this.updateProgress('setup', 'Checking for missing accounts...', 15);
        
        // Build a map of existing account types
        const existingAccountTypes = new Set();
        for (const asset of assets.assets || []) {
            // Map account names to types for matching
            if (asset.name.toLowerCase().includes('checking')) existingAccountTypes.add('checking');
            if (asset.name.toLowerCase().includes('savings')) existingAccountTypes.add('savings');
            if (asset.name.toLowerCase().includes('credit')) existingAccountTypes.add('credit');
            if (asset.name.toLowerCase().includes('investment')) existingAccountTypes.add('investment');
            if (asset.name.toLowerCase().includes('loan') && !asset.name.toLowerCase().includes('mortgage')) existingAccountTypes.add('loan');
            if (asset.name.toLowerCase().includes('mortgage')) existingAccountTypes.add('mortgage');
            if (asset.name.toLowerCase().includes('cash') && !asset.name.toLowerCase().includes('checking')) existingAccountTypes.add('cash');
        }
        
        const accountTemplates = {
                checking: {
                    type_name: 'cash',
                    subtype_name: 'checking',
                    name: 'Demo Checking Account',
                    balance: '5000.00',
                    currency: 'usd'
                },
                savings: {
                    type_name: 'cash',
                    subtype_name: 'savings',
                    name: 'Demo Savings Account',
                    balance: '15000.00',
                    currency: 'usd'
                },
                credit: {
                    type_name: 'credit',
                    subtype_name: 'credit card',
                    name: 'Demo Credit Card',
                    balance: '-850.00',
                    currency: 'usd'
                },
                investment: {
                    type_name: 'investment',
                    subtype_name: 'brokerage',
                    name: 'Demo Investment Account',
                    balance: '25000.00',
                    currency: 'usd'
                },
                loan: {
                    type_name: 'loan',
                    name: 'Demo Loan Account',
                    balance: '-12000.00',
                    currency: 'usd'
                },
                cash: {
                    type_name: 'cash',
                    subtype_name: 'cash',
                    name: 'Demo Cash Account',
                    balance: '500.00',
                    currency: 'usd'
                },
                mortgage: {
                    type_name: 'loan',
                    subtype_name: 'mortgage',
                    name: 'Demo Mortgage Account',
                    balance: '-250000.00',
                    currency: 'usd'
                }
            };
            
            const sampleAccounts = selectedAccounts
                .filter(account => accountTemplates[account.type] && !existingAccountTypes.has(account.type))
                .map(account => ({
                    ...accountTemplates[account.type],
                    balance: account.balance.toFixed(2)
                }));
            
            console.log('Existing account types:', Array.from(existingAccountTypes));
            console.log('Selected accounts to create (new only):', sampleAccounts);
            
            // Create any missing accounts
            if (sampleAccounts.length > 0) {
                this.updateProgress('setup', `Creating ${sampleAccounts.length} new account(s)...`, 15);
                
                for (const accountData of sampleAccounts) {
                    this.updateProgress('setup', `Creating ${accountData.name}...`, 15);
                    
                    try {
                        console.log('Creating account:', accountData);
                        const result = await this.api.createAsset(accountData);
                        console.log('Account creation result:', result);
                        
                        if (result && accountData.type_name === 'cash' && accountData.subtype_name === 'checking') {
                            checkingAccount = {
                                id: result.asset_id || result.id,
                                display_name: accountData.name,
                                name: accountData.name,
                                type_name: accountData.type_name
                            };
                        }
                    } catch (error) {
                        console.error(`Failed to create ${accountData.name}:`, error);
                        console.error('Account data was:', accountData);
                    }
                }
            }
        
        if (!checkingAccount) {
            throw new Error('Unable to find or create a checking account');
        }
        
        this.accountId = checkingAccount.id;
        this.updateProgress('setup', `Using account: ${checkingAccount.display_name || checkingAccount.name}`, 20);
        
        // Get existing categories
        this.updateProgress('setup', 'Setting up categories...', 30);
        const categoriesResponse = await this.api.getCategories();
        const existingCategories = {};
        
        for (const cat of categoriesResponse.categories || []) {
            existingCategories[cat.name] = cat.id;
        }
        
        // Create missing categories
        const neededCategories = [
            { name: "Income", isIncome: true },
            { name: "Housing", isIncome: false },
            { name: "Utilities", isIncome: false },
            { name: "Subscriptions", isIncome: false },
            { name: "Entertainment", isIncome: false },
            { name: "Education", isIncome: false },
            { name: "Transportation", isIncome: false },
            { name: "Savings", isIncome: false },
            { name: "Credit Card Payment", isIncome: false },
            { name: "Loan Payment", isIncome: false },
            { name: "Mortgage Payment", isIncome: false }
        ];
        
        let progress = 30;
        for (const category of neededCategories) {
            if (existingCategories[category.name]) {
                this.categories[category.name] = existingCategories[category.name];
                this.updateProgress('setup', `Using existing category: ${category.name}`, progress);
            } else {
                this.updateProgress('setup', `Creating category: ${category.name}...`, progress);
                const result = await this.api.createCategory(category.name, category.isIncome);
                if (result.category_id) {
                    this.categories[category.name] = result.category_id;
                } else {
                    throw new Error(`Failed to create category: ${category.name}`);
                }
            }
            progress += 5;
        }
        
        this.updateProgress('setup', 'Categories ready!', 60);
        return { account: checkingAccount, categories: this.categories };
    }

    getTransactionDate(year, month, day) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const actualDay = Math.min(day, daysInMonth);
        const date = new Date(year, month - 1, actualDay);
        return date.toISOString().split('T')[0];
    }

    generateTransactions(months, numItems = 10, selectedAccounts = []) {
        this.updateProgress('generate', 'Generating transactions...', 70);
        
        const transactions = [];
        let selectedTransactions = this.recurringTransactions.slice(0, numItems);
        
        // Add automatic payments for credit card and loan accounts if selected
        const additionalPayments = [];
        
        for (const account of selectedAccounts) {
            if (account.type === 'credit' && account.balance < 0) {
                // Add credit card minimum payment (3% of balance or $25, whichever is greater)
                const minPayment = Math.max(Math.abs(account.balance) * 0.03, 25);
                additionalPayments.push({
                    payee: "Credit Card Payment",
                    amount: -minPayment,
                    day: 5,
                    category: "Credit Card Payment",
                    notes: "Monthly minimum payment"
                });
            } else if (account.type === 'loan' && account.balance < 0) {
                // Add loan payment (2% of balance for simplicity)
                const loanPayment = Math.abs(account.balance) * 0.02;
                additionalPayments.push({
                    payee: "Loan Payment", 
                    amount: -loanPayment,
                    day: 20,
                    category: "Loan Payment",
                    notes: "Monthly loan payment"
                });
            } else if (account.type === 'mortgage' && account.balance < 0) {
                // Add mortgage payment (0.4% of balance for ~30 year mortgage)
                const mortgagePayment = Math.abs(account.balance) * 0.004;
                additionalPayments.push({
                    payee: "Mortgage Payment",
                    amount: -mortgagePayment,
                    day: 1,
                    category: "Mortgage Payment",
                    notes: "Monthly mortgage payment"
                });
            }
        }
        
        // Combine regular transactions with additional payments
        selectedTransactions = [...selectedTransactions, ...additionalPayments];
        
        // Start from today and go backwards
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
        
        console.log('Generating transactions with months:', months, 'numItems:', numItems);
        console.log('Starting from today:', currentYear + '-' + currentMonth);
        
        for (let monthOffset = 0; monthOffset < months; monthOffset++) {
            let year = currentYear;
            let month = currentMonth - monthOffset;
            
            // Handle going back across year boundaries
            if (month <= 0) {
                year += Math.floor((month - 1) / 12);
                month = ((month - 1) % 12) + 12;
            }
            
            console.log('Generating transactions for ' + year + '-' + (month < 10 ? '0' : '') + month);
            
            for (const txn of selectedTransactions) {
                const date = this.getTransactionDate(year, month, txn.day);
                const categoryId = this.categories[txn.category];
                
                if (!categoryId) {
                    console.error('Missing category ID for ' + txn.category);
                    continue;
                }
                
                if (!this.accountId) {
                    console.error('Missing account ID');
                    continue;
                }
                
                const transaction = {
                    date,
                    amount: txn.amount,
                    payee: txn.payee,
                    category_id: categoryId,
                    asset_id: this.accountId,
                    notes: txn.notes,
                    status: 'cleared'
                };
                
                transactions.push(transaction);
                console.log('Generated transaction: ' + txn.payee + ' - ' + txn.amount + ' on ' + date);
            }
        }
        
        console.log('Total transactions generated: ' + transactions.length);
        return transactions;
    }

    async insertTransactions(transactions) {
        this.updateProgress('insert', 'Creating transactions...', 80);
        
        console.log('Attempting to create transactions:', transactions.length);
        console.log('Sample transaction:', transactions[0]);
        
        const batchSize = 500;
        let totalCreated = 0;
        
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(transactions.length / batchSize);
            
            this.updateProgress('insert', 'Creating batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' transactions)...', 80 + (batchNum / totalBatches * 15));
            
            const result = await this.api.createTransactions(batch);
            
            console.log('API Response:', result);
            
            if (result) {
                if (result.ids) {
                    totalCreated += result.ids.length;
                    console.log('Created ' + result.ids.length + ' transactions in batch ' + batchNum);
                } else {
                    console.warn('No ids in response:', result);
                }
            } else {
                console.error('No result from API for batch ' + batchNum);
            }
        }
        
        console.log('Total transactions created:', totalCreated);
        return totalCreated;
    }

    async checkRecurringDetection() {
        this.updateProgress('check', 'Checking recurring detection...', 95);
        
        const response = await this.api.getTransactions('2025-02-01', '2025-07-31');
        const recurringPatterns = {};
        
        for (const txn of response.transactions || []) {
            if (txn.recurring_type === 'suggested' && txn.recurring_id) {
                const id = txn.recurring_id;
                if (!recurringPatterns[id]) {
                    recurringPatterns[id] = {
                        payee: txn.recurring_payee,
                        amount: txn.recurring_amount,
                        count: 0
                    };
                }
                recurringPatterns[id].count++;
            }
        }
        
        return Object.values(recurringPatterns);
    }

    async run(months, numItems = 10, selectedAccounts = [{type: 'checking', balance: 5000}, {type: 'savings', balance: 15000}, {type: 'credit', balance: -850}, {type: 'investment', balance: 25000}]) {
        try {
            this.updateProgress('start', 'Starting transaction generation...', 0);
            
            const setupResult = await this.setupAccountAndCategories(selectedAccounts);
            const transactions = this.generateTransactions(months, numItems, selectedAccounts);
            const createdCount = await this.insertTransactions(transactions);
            const recurringPatterns = await this.checkRecurringDetection();
            
            this.updateProgress('complete', 'Generation complete!', 100);
            
            return {
                success: true,
                created: createdCount,
                months,
                numItems,
                account: setupResult.account,
                patterns: recurringPatterns
            };
        } catch (error) {
            this.updateProgress('error', 'Error: ' + error.message, 0);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// UI Controller
class UIController {
    constructor() {
        this.generator = new TransactionGenerator();
        this.generator.setProgressCallback(this.updateProgress.bind(this));
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        const validateBtn = document.getElementById('validateApi');
        if (validateBtn) {
            validateBtn.addEventListener('click', this.validateApiKey.bind(this));
            console.log('Validate button event listener added');
        } else {
            console.error('Validate button not found!');
        }
        
        const confirmTestBtn = document.getElementById('confirmTest');
        if (confirmTestBtn) {
            confirmTestBtn.addEventListener('change', this.toggleGenerateButton.bind(this));
        }
        
        const confirmExistingDataBtn = document.getElementById('confirmExistingData');
        if (confirmExistingDataBtn) {
            confirmExistingDataBtn.addEventListener('change', this.toggleGenerateButton.bind(this));
        }
        
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', this.generateTransactions.bind(this));
        }
        
        const recurringItemsInput = document.getElementById('recurringItems');
        if (recurringItemsInput) {
            recurringItemsInput.addEventListener('input', this.updatePreview.bind(this));
        }
        
        const monthsInput = document.getElementById('months');
        if (monthsInput) {
            monthsInput.addEventListener('input', this.updatePreview.bind(this));
        }
        
        // Add event listeners for account type checkboxes
        const accountCheckboxes = document.querySelectorAll('.account-types input[type="checkbox"]');
        accountCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.updatePreview.bind(this));
        });
        
        // Add event listeners for balance inputs
        const balanceInputs = document.querySelectorAll('.balance-input');
        balanceInputs.forEach(input => {
            input.addEventListener('input', this.updatePreview.bind(this));
        });
        
        console.log('Event listeners setup complete');
    }

    async validateApiKey() {
        console.log('validateApiKey called');
        
        const apiKey = document.getElementById('apiKey').value.trim();
        const button = document.getElementById('validateApi');
        
        console.log('API Key:', apiKey ? 'Present' : 'Missing');
        
        if (!apiKey) {
            alert('Please enter your API key');
            return;
        }
        
        button.disabled = true;
        button.textContent = 'Validating...';
        
        try {
            console.log('Validating API key...');
            const result = await this.generator.validateApiKey(apiKey);
            console.log('Validation result:', result);
            
            if (result.valid) {
                console.log('API key is valid, showing sections...');
                document.getElementById('accountInfo').style.display = 'block';
                document.getElementById('configSection').style.display = 'block';
                document.getElementById('actionSection').style.display = 'block';
                
                // Check if account is empty
                console.log('Checking account status...');
                const accountStatus = await this.generator.checkAccountEmpty();
                console.log('Account status:', accountStatus);
                
                let statusHtml = `
                    <div class="account-details">
                        <p><strong>✅ API Key Valid</strong></p>
                        <p>User: ${result.user.user_name}</p>
                        <p>Email: ${result.user.user_email}</p>
                `;
                
                if (accountStatus.empty) {
                    statusHtml += `<p class="success">✅ Account appears to be empty (perfect for testing)</p>`;
                } else if (accountStatus.count > 0) {
                    statusHtml += `<p class="warning">⚠️ Account has ${accountStatus.count} existing transactions</p>`;
                    statusHtml += `<p class="warning-text"><strong>Warning:</strong> This tool will add sample data to your existing account. For the best demo experience, consider using a fresh account with "Skip the walkthrough" selected.</p>`;
                    
                    // Show additional confirmation checkbox for existing data
                    document.getElementById('existingDataWarning').style.display = 'block';
                }
                
                statusHtml += `</div>`;
                
                document.getElementById('accountDetails').innerHTML = statusHtml;
                button.textContent = '✅ Valid';
                button.classList.add('success');
                
                // Update the preview with default values
                console.log('Updating preview...');
                this.updatePreview();
            } else {
                console.error('Invalid API key:', result.error);
                alert(`Invalid API key: ${result.error}`);
                button.textContent = 'Validate API Key';
            }
        } catch (error) {
            console.error('Validation error:', error);
            alert(`Validation failed: ${error.message}`);
            button.textContent = 'Validate API Key';
        } finally {
            button.disabled = false;
        }
    }

    toggleGenerateButton() {
        const confirmTestCheckbox = document.getElementById('confirmTest');
        const confirmExistingDataCheckbox = document.getElementById('confirmExistingData');
        const existingDataWarning = document.getElementById('existingDataWarning');
        const button = document.getElementById('generateBtn');
        
        // Always require the test confirmation
        let canGenerate = confirmTestCheckbox.checked;
        
        // If existing data warning is shown, also require that confirmation
        if (existingDataWarning.style.display === 'block') {
            canGenerate = canGenerate && confirmExistingDataCheckbox.checked;
        }
        
        button.disabled = !canGenerate;
    }

    updatePreview() {
        const numItems = parseInt(document.getElementById('recurringItems').value) || 10;
        const months = parseInt(document.getElementById('months').value) || 3;
        
        // Get the selected transactions
        const selectedTransactions = this.generator.recurringTransactions.slice(0, numItems);
        
        // Calculate totals
        let totalIncome = 0;
        let totalExpenses = 0;
        let incomeCount = 0;
        let expenseCount = 0;
        
        for (const txn of selectedTransactions) {
            if (txn.amount > 0) {
                totalIncome += txn.amount;
                incomeCount++;
            } else {
                totalExpenses += Math.abs(txn.amount);
                expenseCount++;
            }
        }
        
        // Build preview HTML
        let previewHtml = `
            <h3>📋 What will be created:</h3>
            <div class="transaction-preview">
                <h4>💰 Income (${incomeCount} types):</h4>
                <ul>
        `;
        
        for (const txn of selectedTransactions.filter(t => t.amount > 0)) {
            previewHtml += `<li>${txn.notes}: $${txn.amount.toFixed(2)} on ${txn.day}${this.getOrdinalSuffix(txn.day)} of each month</li>`;
        }
        
        previewHtml += `</ul><h4>💸 Expenses (${expenseCount} types):</h4><ul>`;
        
        for (const txn of selectedTransactions.filter(t => t.amount < 0)) {
            previewHtml += `<li>${txn.notes}: $${Math.abs(txn.amount).toFixed(2)} on ${txn.day}${this.getOrdinalSuffix(txn.day)} of each month</li>`;
        }
        
        previewHtml += `
                </ul>
                <div class="total-preview">
                    <strong>Total per month: +$${totalIncome.toFixed(2)} income, -$${totalExpenses.toFixed(2)} expenses</strong><br>
                    <strong>Net per month: $${(totalIncome - totalExpenses).toFixed(2)}</strong><br>
                    <strong>Total transactions: ${numItems * months}</strong>
                </div>
        `;
        
        // Add selected accounts preview
        const accountCheckboxes = document.querySelectorAll('.account-types input[type="checkbox"]:checked');
        const selectedAccounts = Array.from(accountCheckboxes).map(cb => {
            const accountType = cb.value;
            const accountName = cb.parentElement.querySelector('span').textContent;
            const balanceInput = document.getElementById(`balance-${accountType}`);
            const balance = parseFloat(balanceInput.value) || 0;
            return { name: accountName, balance: balance };
        });
        
        if (selectedAccounts.length > 0) {
            previewHtml += `
                <h4>💳 Accounts to Create:</h4>
                <ul>
            `;
            let hasLoanOrCredit = false;
            for (const account of selectedAccounts) {
                const formattedBalance = account.balance < 0 
                    ? `-$${Math.abs(account.balance).toFixed(2)}`
                    : `$${account.balance.toFixed(2)}`;
                previewHtml += `<li>${account.name}: ${formattedBalance}</li>`;
                
                // Check if we need to add automatic payments
                if ((account.name.includes('Credit Card') || account.name.includes('Loan') || account.name.includes('Mortgage')) && account.balance < 0) {
                    hasLoanOrCredit = true;
                }
            }
            previewHtml += `</ul>`;
            
            // Show automatic payments info
            if (hasLoanOrCredit) {
                previewHtml += `
                    <div class="automatic-payments-info">
                        <strong>💰 Automatic Payments:</strong><br>
                `;
                
                for (const account of selectedAccounts) {
                    if (account.name.includes('Credit Card') && account.balance < 0) {
                        const minPayment = Math.max(Math.abs(account.balance) * 0.03, 25);
                        previewHtml += `• Credit Card Payment: $${minPayment.toFixed(2)}/month on the 5th<br>`;
                    }
                    if (account.name.includes('Loan') && account.balance < 0) {
                        const loanPayment = Math.abs(account.balance) * 0.02;
                        previewHtml += `• Loan Payment: $${loanPayment.toFixed(2)}/month on the 20th<br>`;
                    }
                    if (account.name.includes('Mortgage') && account.balance < 0) {
                        const mortgagePayment = Math.abs(account.balance) * 0.004;
                        previewHtml += `• Mortgage Payment: $${mortgagePayment.toFixed(2)}/month on the 1st<br>`;
                    }
                }
                
                previewHtml += `</div>`;
            }
        }
        
        previewHtml += `</div>`;
        
        document.querySelector('.transaction-preview').innerHTML = previewHtml;
    }
    
    getOrdinalSuffix(day) {
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    updateProgress(step, message, percentage) {
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressLog = document.getElementById('progressLog');
        
        progressSection.style.display = 'block';
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = message;
        
        // Add to log
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        progressLog.appendChild(logEntry);
        
        // Scroll to bottom
        progressLog.scrollTop = progressLog.scrollHeight;
    }

    async generateTransactions() {
        const months = parseInt(document.getElementById('months').value);
        const numItems = parseInt(document.getElementById('recurringItems').value);
        
        // Get selected account types and their balances
        const accountCheckboxes = document.querySelectorAll('.account-types input[type="checkbox"]:checked');
        const selectedAccounts = Array.from(accountCheckboxes).map(cb => {
            const accountType = cb.value;
            const balanceInput = document.getElementById(`balance-${accountType}`);
            const balance = parseFloat(balanceInput.value) || 0;
            return { type: accountType, balance: balance };
        });
        
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('progressLog').innerHTML = '';
        
        const result = await this.generator.run(months, numItems, selectedAccounts);
        
        document.getElementById('resultsSection').style.display = 'block';
        
        if (result.success) {
            let resultsHtml = `
                <div class="success-message">
                    <h3>🎉 Success!</h3>
                    <p>Created ${result.created} transactions across ${result.months} months</p>
                    <p>Generated ${result.numItems} recurring transaction types</p>
                    <p>Account: ${result.account.display_name || result.account.name || 'Demo Checking Account'}</p>
                </div>
            `;
            
            if (result.patterns.length > 0) {
                resultsHtml += `
                    <div class="recurring-patterns">
                        <h4>🔄 Detected Recurring Patterns:</h4>
                        <ul>
                `;
                
                for (const pattern of result.patterns) {
                    resultsHtml += `<li>${pattern.payee}: ${pattern.amount} (${pattern.count} occurrences)</li>`;
                }
                
                resultsHtml += `</ul></div>`;
            }
            
            resultsHtml += `
                <div class="next-steps">
                    <h4>Next Steps:</h4>
                    <ul>
                        <li>Check your LunchMoney account to see the new transactions</li>
                        <li><strong>Go to Recurring in LunchMoney and approve the suggested items</strong></li>
                        <li>LunchMoney will automatically detect recurring patterns</li>
                        <li>You can now test budgeting and reporting features</li>
                    </ul>
                </div>
            `;
            
            document.getElementById('results').innerHTML = resultsHtml;
        } else {
            document.getElementById('results').innerHTML = `
                <div class="error-message">
                    <h3>❌ Error</h3>
                    <p>${result.error}</p>
                </div>
            `;
        }
        
        document.getElementById('generateBtn').disabled = false;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI controller...');
    try {
        new UIController();
        console.log('UI controller initialized successfully');
    } catch (error) {
        console.error('Failed to initialize UI controller:', error);
    }
});