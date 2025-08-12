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
        this.accountBalances = {}; // Track balances for amortization
        
        // Currency symbols mapping - All currencies supported by projected-cashflow
        this.currencySymbols = {
            // Americas
            'usd': '$',
            'cad': 'C$',
            'mxn': '$',
            'brl': 'R$',
            'ars': '$',
            'clp': '$',
            'cop': '$',
            'pen': 'S/',
            // Europe
            'eur': '€',
            'gbp': '£',
            'chf': 'Fr',
            'sek': 'kr',
            'nok': 'kr',
            'dkk': 'kr',
            'pln': 'zł',
            'czk': 'Kč',
            'rub': '₽',
            'uah': '₴',
            // Asia-Pacific
            'jpy': '¥',
            'cny': '¥',
            'krw': '₩',
            'aud': 'A$',
            'nzd': 'NZ$',
            'sgd': 'S$',
            'hkd': 'HK$',
            'inr': '₹',
            'thb': '฿',
            'myr': 'RM',
            'php': '₱',
            'idr': 'Rp',
            'vnd': '₫',
            // Middle East & Africa
            'aed': 'د.إ',
            'sar': '﷼',
            'ils': '₪',
            'zar': 'R',
            'ngn': '₦',
            'kes': 'KSh',
            'egp': '£',
            'try': '₺'
        };
        
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
        
        // International transaction patterns for all supported currencies
        this.internationalTransactions = {
            'eur': [
                { payee: "European Salary Corp", amount: 4500.00, day: 1, category: "Income", notes: "EUR Salary Deposit" },
                { payee: "Deutsche Miete GmbH", amount: -1200.00, day: 3, category: "Housing", notes: "EUR Rent Payment" },
                { payee: "Telekom Europa", amount: -65.00, day: 10, category: "Utilities", notes: "EUR Phone/Internet" }
            ],
            'gbp': [
                { payee: "UK Employer Ltd", amount: 3800.00, day: 25, category: "Income", notes: "GBP Salary" },
                { payee: "British Landlords", amount: -1650.00, day: 1, category: "Housing", notes: "GBP Rent" },
                { payee: "Thames Water", amount: -45.00, day: 15, category: "Utilities", notes: "GBP Water Bill" }
            ],
            'jpy': [
                { payee: "Tokyo Corp", amount: 450000, day: 25, category: "Income", notes: "JPY Salary" },
                { payee: "Apartment Tokyo", amount: -150000, day: 27, category: "Housing", notes: "JPY Rent" },
                { payee: "JR Pass", amount: -10000, day: 1, category: "Transportation", notes: "JPY Train Pass" }
            ],
            'cad': [
                { payee: "Canadian Employer", amount: 4200.00, day: 15, category: "Income", notes: "CAD Salary" },
                { payee: "Toronto Housing", amount: -2100.00, day: 1, category: "Housing", notes: "CAD Rent" }
            ],
            'aud': [
                { payee: "Australian Company", amount: 5200.00, day: 1, category: "Income", notes: "AUD Salary" },
                { payee: "Sydney Rentals", amount: -2400.00, day: 5, category: "Housing", notes: "AUD Rent" }
            ],
            'sgd': [
                { payee: "Singapore Tech", amount: 6000.00, day: 25, category: "Income", notes: "SGD Salary" },
                { payee: "HDB Rental", amount: -2200.00, day: 1, category: "Housing", notes: "SGD Rent" }
            ],
            'inr': [
                { payee: "Indian IT Services", amount: 150000, day: 1, category: "Income", notes: "INR Salary" },
                { payee: "Mumbai Housing", amount: -45000, day: 5, category: "Housing", notes: "INR Rent" }
            ],
            'mxn': [
                { payee: "Empresa Mexico", amount: 45000, day: 15, category: "Income", notes: "MXN Salary" },
                { payee: "Renta CDMX", amount: -18000, day: 1, category: "Housing", notes: "MXN Rent" }
            ],
            'brl': [
                { payee: "Empresa Brasil", amount: 8000.00, day: 5, category: "Income", notes: "BRL Salary" },
                { payee: "Aluguel São Paulo", amount: -3200.00, day: 10, category: "Housing", notes: "BRL Rent" }
            ],
            'zar': [
                { payee: "SA Company", amount: 35000, day: 25, category: "Income", notes: "ZAR Salary" },
                { payee: "Cape Town Rental", amount: -12000, day: 1, category: "Housing", notes: "ZAR Rent" }
            ]
        };
    }
    
    formatCurrency(amount, currency = 'usd') {
        const symbol = this.currencySymbols[currency.toLowerCase()] || '$';
        const absAmount = Math.abs(amount);
        
        // Special formatting for JPY (no decimals)
        if (currency.toLowerCase() === 'jpy') {
            return amount < 0 ? `-${symbol}${absAmount.toLocaleString('en-US', {maximumFractionDigits: 0})}` : `${symbol}${absAmount.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
        }
        
        return amount < 0 ? `-${symbol}${absAmount.toFixed(2)}` : `${symbol}${absAmount.toFixed(2)}`;
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

    async setupAccountAndCategories(selectedAccounts = [{type: 'checking', balance: 5000, currency: 'usd'}, {type: 'savings', balance: 15000, currency: 'usd'}, {type: 'credit', balance: -850, currency: 'usd'}, {type: 'investment', balance: 25000, currency: 'usd'}]) {
        this.updateProgress('setup', 'Getting account information...', 10);
        
        // Get existing accounts
        const assets = await this.api.getAssets();
        let checkingAccount = null;
        this.currencyAccounts = {}; // Store account IDs by currency
        
        // Look for existing checking account (prefer USD for backward compatibility)
        for (const asset of assets.assets || []) {
            if (asset.type_name === 'cash' && asset.name.toLowerCase().includes('checking')) {
                // Store account by currency
                const assetCurrency = (asset.currency || 'usd').toLowerCase();
                this.currencyAccounts[assetCurrency] = asset.id;
                
                // Set primary checking account (prefer USD)
                if (!checkingAccount || assetCurrency === 'usd') {
                    checkingAccount = asset;
                }
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
                },
                // Foreign currency accounts
                'checking-eur': {
                    type_name: 'cash',
                    subtype_name: 'checking',
                    name: 'EUR Checking Account',
                    balance: '5000.00',
                    currency: 'eur'
                },
                'checking-gbp': {
                    type_name: 'cash',
                    subtype_name: 'checking',
                    name: 'GBP Checking Account',
                    balance: '4000.00',
                    currency: 'gbp'
                },
                'checking-jpy': {
                    type_name: 'cash',
                    subtype_name: 'checking',
                    name: 'JPY Checking Account',
                    balance: '500000',
                    currency: 'jpy'
                },
                'credit-eur': {
                    type_name: 'credit',
                    subtype_name: 'credit card',
                    name: 'EUR Credit Card',
                    balance: '-1200.00',
                    currency: 'eur'
                },
                'mortgage-gbp': {
                    type_name: 'loan',
                    subtype_name: 'mortgage',
                    name: 'UK Property Mortgage',
                    balance: '-180000.00',
                    currency: 'gbp'
                }
            };
            
            const sampleAccounts = selectedAccounts
                .filter(account => {
                    const templateKey = account.currency && account.currency !== 'usd' 
                        ? `${account.type}-${account.currency}` 
                        : account.type;
                    return (accountTemplates[templateKey] || accountTemplates[account.type]) && !existingAccountTypes.has(account.type);
                })
                .map(account => {
                    const templateKey = account.currency && account.currency !== 'usd' 
                        ? `${account.type}-${account.currency}` 
                        : account.type;
                    const template = accountTemplates[templateKey] || accountTemplates[account.type];
                    
                    // Format balance based on currency (no decimals for JPY)
                    const balance = account.currency === 'jpy' 
                        ? Math.round(account.balance).toString()
                        : account.balance.toFixed(2);
                    
                    // Add currency to name if not USD
                    const currency = account.currency || template.currency || 'usd';
                    let accountName = account.customName || template.name;
                    if (currency !== 'usd' && !accountName.includes(currency.toUpperCase())) {
                        accountName = `${currency.toUpperCase()} ${accountName}`;
                    }
                    
                    return {
                        ...template,
                        balance: balance,
                        currency: currency,
                        name: accountName
                    };
                });
            
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
                            const assetId = result.asset_id || result.id;
                            const assetCurrency = (accountData.currency || 'usd').toLowerCase();
                            
                            // Store account by currency
                            this.currencyAccounts[assetCurrency] = assetId;
                            
                            // Set as primary checking if it's USD or we don't have one yet
                            if (!checkingAccount || assetCurrency === 'usd') {
                                checkingAccount = {
                                    id: assetId,
                                    display_name: accountData.name,
                                    name: accountData.name,
                                    type_name: accountData.type_name,
                                    currency: assetCurrency
                                };
                            }
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
        
        // Initialize account balances for tracking
        this.accountBalances = {};
        for (const account of selectedAccounts) {
            const accountKey = `${account.type}-${account.currency || 'usd'}`;
            this.accountBalances[accountKey] = {
                current: Math.abs(account.balance),
                original: Math.abs(account.balance),
                rate: account.rate || 0,
                remainingMonths: account.remainingMonths || (account.type === 'mortgage' ? 360 : 60),
                currency: account.currency || 'usd',
                type: account.type
            };
        }
        
        // Process month by month for proper amortization
        const additionalPaymentsPerMonth = [];
        
        for (const account of selectedAccounts) {
            const accountKey = `${account.type}-${account.currency || 'usd'}`;
            const currency = account.currency || 'usd';
            const symbol = this.currencySymbols[currency.toLowerCase()] || '$';
            
            if (account.type === 'credit' && account.balance < 0) {
                // Credit card with daily compounding
                const balance = Math.abs(account.balance);
                const annualRate = account.rate || 16;
                const dailyRate = annualRate / 100 / 365;
                const effectiveMonthlyRate = Math.pow(1 + dailyRate, 30) - 1;
                const interestCharge = balance * effectiveMonthlyRate;
                const minPayment = Math.max(balance * 0.03, 25) + interestCharge;
                
                additionalPaymentsPerMonth.push({
                    payee: currency !== 'usd' ? `${currency.toUpperCase()} Credit Card Payment` : "Credit Card Payment",
                    amount: -parseFloat(minPayment.toFixed(2)),
                    day: 5,
                    category: "Credit Card Payment",
                    notes: `Min payment (${annualRate}% APR, daily compounding)`,
                    currency: currency,
                    accountKey: accountKey,
                    type: 'credit'
                });
            } else if (account.type === 'loan' && account.balance < 0) {
                // Loan with monthly compounding
                const principal = Math.abs(account.balance);
                const monthlyRate = (account.rate || 10) / 100 / 12;
                const numPayments = account.remainingMonths || 60;
                
                let loanPayment;
                if (monthlyRate > 0 && numPayments > 0) {
                    loanPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                  (Math.pow(1 + monthlyRate, numPayments) - 1);
                } else {
                    loanPayment = principal / numPayments;
                }
                
                additionalPaymentsPerMonth.push({
                    payee: currency !== 'usd' ? `${currency.toUpperCase()} Loan Payment` : "Loan Payment",
                    amount: -parseFloat(loanPayment.toFixed(2)),
                    day: 20,
                    category: "Loan Payment",
                    notes: ``, // Will be updated each month
                    currency: currency,
                    accountKey: accountKey,
                    type: 'loan',
                    fixedPayment: loanPayment,
                    rate: account.rate || 10
                });
            } else if (account.type === 'mortgage' && account.balance < 0) {
                // Mortgage with monthly compounding and proper amortization
                const principal = Math.abs(account.balance);
                const monthlyRate = (account.rate || 7) / 100 / 12;
                const numPayments = account.remainingMonths || 360;
                
                let mortgagePayment;
                if (monthlyRate > 0 && numPayments > 0) {
                    mortgagePayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                      (Math.pow(1 + monthlyRate, numPayments) - 1);
                } else {
                    mortgagePayment = principal / numPayments;
                }
                
                additionalPaymentsPerMonth.push({
                    payee: currency !== 'usd' ? `${currency.toUpperCase()} Mortgage Payment` : "Mortgage Payment",
                    amount: -parseFloat(mortgagePayment.toFixed(2)),
                    day: 1,
                    category: "Mortgage Payment",
                    notes: ``, // Will be updated each month with actual P&I
                    currency: currency,
                    accountKey: accountKey,
                    type: 'mortgage',
                    fixedPayment: mortgagePayment,
                    rate: account.rate || 7
                });
            }
        }
        
        // Get international transactions if using foreign currencies
        const usedCurrencies = new Set(selectedAccounts.map(a => a.currency || 'usd'));
        for (const currency of usedCurrencies) {
            if (currency !== 'usd' && this.internationalTransactions[currency]) {
                // Add some international transactions with currency field
                const intlTxns = this.internationalTransactions[currency]
                    .slice(0, Math.min(3, Math.floor(numItems / 3)))
                    .map(txn => ({ ...txn, currency: currency }));
                selectedTransactions = [...selectedTransactions, ...intlTxns];
            }
        }
        
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
            
            // Process additional payments with proper amortization
            const monthlyPayments = additionalPaymentsPerMonth.map(payment => {
                const accountInfo = this.accountBalances[payment.accountKey];
                const updatedPayment = { ...payment };
                
                if (payment.type === 'mortgage') {
                    // Calculate P&I for current balance
                    const currentBalance = accountInfo.current;
                    const monthlyRate = payment.rate / 100 / 12;
                    const interestPayment = currentBalance * monthlyRate;
                    const principalPayment = payment.fixedPayment - interestPayment;
                    const remainingMonths = accountInfo.remainingMonths - monthOffset;
                    
                    // Update balance for next month
                    accountInfo.current = Math.max(0, currentBalance - principalPayment);
                    
                    // Format based on currency
                    const symbol = this.currencySymbols[payment.currency.toLowerCase()] || '$';
                    updatedPayment.notes = `P&I: ${this.formatCurrency(principalPayment, payment.currency)} principal, ${this.formatCurrency(interestPayment, payment.currency)} interest (${payment.rate}% APR, ${remainingMonths}mo left)`;
                    
                } else if (payment.type === 'loan') {
                    // Calculate interest and principal for loan
                    const currentBalance = accountInfo.current;
                    const monthlyRate = payment.rate / 100 / 12;
                    const interestPayment = currentBalance * monthlyRate;
                    const principalPayment = payment.fixedPayment - interestPayment;
                    const remainingMonths = accountInfo.remainingMonths - monthOffset;
                    
                    // Update balance
                    accountInfo.current = Math.max(0, currentBalance - principalPayment);
                    
                    // Convert months to years for display
                    const years = Math.floor(remainingMonths / 12);
                    const months = remainingMonths % 12;
                    const termDisplay = years > 0 ? `${years}yr${months > 0 ? ' ' + months + 'mo' : ''}` : `${months}mo`;
                    
                    updatedPayment.notes = `Monthly payment (${payment.rate}% APR, ${remainingMonths}mo/${termDisplay} left)`;
                }
                
                return updatedPayment;
            });
            
            // Combine regular transactions with calculated payments
            const allTransactions = [...selectedTransactions, ...monthlyPayments];
            
            for (const txn of allTransactions) {
                const date = this.getTransactionDate(year, month, txn.day);
                const categoryId = this.categories[txn.category];
                
                if (!categoryId) {
                    console.error('Missing category ID for ' + txn.category);
                    continue;
                }
                
                // Determine which account to use based on currency
                const txnCurrency = (txn.currency || 'usd').toLowerCase();
                let assetId = this.currencyAccounts[txnCurrency] || this.accountId;
                
                if (!assetId) {
                    console.error('No account found for currency: ' + txnCurrency);
                    // Fallback to main account if available
                    assetId = this.accountId;
                    if (!assetId) {
                        console.error('Missing account ID');
                        continue;
                    }
                }
                
                const transaction = {
                    date,
                    amount: txn.amount,
                    payee: txn.payee,
                    category_id: categoryId,
                    asset_id: assetId,
                    notes: txn.notes,
                    status: 'cleared'
                };
                
                // Always specify currency to be explicit
                transaction.currency = txnCurrency;
                
                transactions.push(transaction);
                console.log('Generated transaction: ' + txn.payee + ' - ' + this.formatCurrency(txn.amount, txn.currency || 'usd') + ' on ' + date);
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
    
    applyPreset(preset) {
        // Clear all checkboxes first
        document.querySelectorAll('.account-types input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        switch(preset) {
            case 'europe':
                // EUR checking and savings, EUR credit card, EUR mortgage
                document.getElementById('account-checking').checked = true;
                document.getElementById('balance-checking').value = 5000;
                document.getElementById('currency-checking').value = 'eur';
                
                document.getElementById('account-savings').checked = true;
                document.getElementById('balance-savings').value = 20000;
                document.getElementById('currency-savings').value = 'eur';
                
                document.getElementById('account-credit').checked = true;
                document.getElementById('balance-credit').value = -1200;
                document.getElementById('rate-credit').value = 12;
                document.getElementById('currency-credit').value = 'eur';
                
                document.getElementById('account-mortgage').checked = true;
                document.getElementById('balance-mortgage').value = -180000;
                document.getElementById('rate-mortgage').value = 4.5;
                document.getElementById('remaining-mortgage').value = 300;
                document.getElementById('currency-mortgage').value = 'eur';
                break;
                
            case 'uk':
                // GBP accounts
                document.getElementById('account-checking').checked = true;
                document.getElementById('balance-checking').value = 4000;
                document.getElementById('currency-checking').value = 'gbp';
                
                document.getElementById('account-savings').checked = true;
                document.getElementById('balance-savings').value = 15000;
                document.getElementById('currency-savings').value = 'gbp';
                
                document.getElementById('account-credit').checked = true;
                document.getElementById('balance-credit').value = -950;
                document.getElementById('rate-credit').value = 22;
                document.getElementById('currency-credit').value = 'gbp';
                
                document.getElementById('account-mortgage').checked = true;
                document.getElementById('balance-mortgage').value = -220000;
                document.getElementById('rate-mortgage').value = 5.5;
                document.getElementById('remaining-mortgage').value = 348;
                document.getElementById('currency-mortgage').value = 'gbp';
                break;
                
            case 'japan':
                // JPY accounts
                document.getElementById('account-checking').checked = true;
                document.getElementById('balance-checking').value = 500000;
                document.getElementById('currency-checking').value = 'jpy';
                
                document.getElementById('account-savings').checked = true;
                document.getElementById('balance-savings').value = 2000000;
                document.getElementById('currency-savings').value = 'jpy';
                
                document.getElementById('account-credit').checked = true;
                document.getElementById('balance-credit').value = -100000;
                document.getElementById('rate-credit').value = 15;
                document.getElementById('currency-credit').value = 'jpy';
                break;
                
            case 'canada':
                // CAD accounts
                document.getElementById('account-checking').checked = true;
                document.getElementById('balance-checking').value = 6000;
                document.getElementById('currency-checking').value = 'cad';
                
                document.getElementById('account-savings').checked = true;
                document.getElementById('balance-savings').value = 18000;
                document.getElementById('currency-savings').value = 'cad';
                
                document.getElementById('account-mortgage').checked = true;
                document.getElementById('balance-mortgage').value = -350000;
                document.getElementById('rate-mortgage').value = 6.5;
                document.getElementById('remaining-mortgage').value = 300;
                document.getElementById('currency-mortgage').value = 'cad';
                break;
                
            case 'australia':
                // AUD accounts
                document.getElementById('account-checking').checked = true;
                document.getElementById('balance-checking').value = 7000;
                document.getElementById('currency-checking').value = 'aud';
                
                document.getElementById('account-savings').checked = true;
                document.getElementById('balance-savings').value = 25000;
                document.getElementById('currency-savings').value = 'aud';
                
                document.getElementById('account-credit').checked = true;
                document.getElementById('balance-credit').value = -1800;
                document.getElementById('rate-credit').value = 20;
                document.getElementById('currency-credit').value = 'aud';
                break;
                
            case 'singapore':
                // SGD accounts
                document.getElementById('account-checking').checked = true;
                document.getElementById('balance-checking').value = 8000;
                document.getElementById('currency-checking').value = 'sgd';
                
                document.getElementById('account-investment').checked = true;
                document.getElementById('balance-investment').value = 50000;
                document.getElementById('currency-investment').value = 'sgd';
                
                document.getElementById('account-loan').checked = true;
                document.getElementById('balance-loan').value = -20000;
                document.getElementById('rate-loan').value = 5.5;
                document.getElementById('remaining-loan').value = 48;
                document.getElementById('currency-loan').value = 'sgd';
                break;
                
            case 'multi':
                // Mix of currencies
                document.getElementById('account-checking').checked = true;
                document.getElementById('balance-checking').value = 5000;
                document.getElementById('currency-checking').value = 'usd';
                
                document.getElementById('account-savings').checked = true;
                document.getElementById('balance-savings').value = 10000;
                document.getElementById('currency-savings').value = 'eur';
                
                document.getElementById('account-investment').checked = true;
                document.getElementById('balance-investment').value = 30000;
                document.getElementById('currency-investment').value = 'gbp';
                
                document.getElementById('account-credit').checked = true;
                document.getElementById('balance-credit').value = -100000;
                document.getElementById('rate-credit').value = 15;
                document.getElementById('currency-credit').value = 'jpy';
                
                document.getElementById('account-mortgage').checked = true;
                document.getElementById('balance-mortgage').value = -450000;
                document.getElementById('rate-mortgage').value = 5.8;
                document.getElementById('remaining-mortgage').value = 300;
                document.getElementById('currency-mortgage').value = 'cad';
                break;
        }
        
        this.updatePreview();
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
        
        // Add event listeners for rate inputs
        const rateInputs = document.querySelectorAll('.rate-input');
        rateInputs.forEach(input => {
            input.addEventListener('input', this.updatePreview.bind(this));
        });
        
        // Add event listeners for term inputs (mortgage remaining months)
        const termInputs = document.querySelectorAll('.term-input');
        termInputs.forEach(input => {
            input.addEventListener('input', this.updatePreview.bind(this));
        });
        
        // Add event listeners for currency selectors
        const currencySelects = document.querySelectorAll('.currency-select');
        currencySelects.forEach(select => {
            select.addEventListener('change', this.updatePreview.bind(this));
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
            
            // Get currency
            const currencySelect = document.getElementById(`currency-${accountType}`);
            const currency = currencySelect ? currencySelect.value : 'usd';
            
            // Get interest rate if applicable
            const rateInput = document.getElementById(`rate-${accountType}`);
            const rate = rateInput ? parseFloat(rateInput.value) || 0 : 0;
            
            // Get remaining months for loan or mortgage
            let remainingMonths = undefined;
            if (accountType === 'loan' || accountType === 'mortgage') {
                const remainingInput = document.getElementById(`remaining-${accountType}`);
                if (remainingInput) {
                    remainingMonths = parseInt(remainingInput.value);
                    // Use defaults if the input is empty or invalid
                    if (!remainingMonths || remainingMonths <= 0) {
                        remainingMonths = accountType === 'loan' ? 60 : 360;
                    }
                }
            }
            
            return { 
                name: accountName, 
                balance: balance, 
                type: accountType, 
                rate: rate,
                remainingMonths: remainingMonths,
                currency: currency
            };
        });
        
        if (selectedAccounts.length > 0) {
            previewHtml += `
                <h4>💳 Accounts to Create:</h4>
                <ul>
            `;
            let hasLoanOrCredit = false;
            for (const account of selectedAccounts) {
                const formattedBalance = this.generator.formatCurrency(account.balance, account.currency);
                const currencyCode = account.currency.toUpperCase();
                previewHtml += `<li>${account.name} (${currencyCode}): ${formattedBalance}</li>`;
                
                // Check if we need to add automatic payments
                if ((account.type === 'credit' || account.type === 'loan' || account.type === 'mortgage') && account.balance < 0) {
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
                    if (account.type === 'credit' && account.balance < 0) {
                        const balance = Math.abs(account.balance);
                        const annualRate = account.rate || 16;
                        const dailyRate = annualRate / 100 / 365;
                        const effectiveMonthlyRate = Math.pow(1 + dailyRate, 30) - 1;
                        const interestCharge = balance * effectiveMonthlyRate;
                        const minPayment = Math.max(balance * 0.03, 25) + interestCharge;
                        const formattedPayment = this.generator.formatCurrency(minPayment, account.currency);
                        previewHtml += `• Credit Card Payment: ${formattedPayment}/month on the 5th (${annualRate}% APR, daily compounding)<br>`;
                    }
                    if (account.type === 'loan' && account.balance < 0) {
                        const principal = Math.abs(account.balance);
                        const monthlyRate = (account.rate || 10) / 100 / 12;
                        const numPayments = account.remainingMonths || 60; // Use actual remaining months
                        
                        let loanPayment;
                        if (monthlyRate > 0 && numPayments > 0) {
                            loanPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                          (Math.pow(1 + monthlyRate, numPayments) - 1);
                        } else {
                            loanPayment = principal / numPayments;
                        }
                        
                        // Convert months to years for display
                        const years = Math.floor(numPayments / 12);
                        const months = numPayments % 12;
                        const termDisplay = years > 0 ? `${years}yr${months > 0 ? ' ' + months + 'mo' : ''}` : `${months}mo`;
                        
                        const formattedPayment = this.generator.formatCurrency(loanPayment, account.currency);
                        previewHtml += `• Loan Payment: ${formattedPayment}/month on the 20th (${account.rate}% APR, ${numPayments}mo/${termDisplay})<br>`;
                    }
                    if (account.type === 'mortgage' && account.balance < 0) {
                        const principal = Math.abs(account.balance);
                        const monthlyRate = (account.rate || 7) / 100 / 12;
                        const numPayments = account.remainingMonths || 360; // Use actual remaining months
                        
                        let mortgagePayment;
                        if (monthlyRate > 0 && numPayments > 0) {
                            mortgagePayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                              (Math.pow(1 + monthlyRate, numPayments) - 1);
                        } else {
                            mortgagePayment = principal / numPayments;
                        }
                        
                        // Calculate first month's interest and principal
                        const interestPayment = principal * monthlyRate;
                        const principalPayment = mortgagePayment - interestPayment;
                        
                        // Convert months to years for display
                        const years = Math.floor(numPayments / 12);
                        const months = numPayments % 12;
                        const termDisplay = years > 0 ? `${years}yr${months > 0 ? ' ' + months + 'mo' : ''}` : `${months}mo`;
                        
                        const formattedPayment = this.generator.formatCurrency(mortgagePayment, account.currency);
                        const formattedPrincipal = this.generator.formatCurrency(principalPayment, account.currency);
                        const formattedInterest = this.generator.formatCurrency(interestPayment, account.currency);
                        previewHtml += `• Mortgage Payment: ${formattedPayment}/month on the 1st<br>`;
                        previewHtml += `&nbsp;&nbsp;&nbsp;→ Principal: ${formattedPrincipal}, Interest: ${formattedInterest} (${account.rate}% APR, ${numPayments}mo/${termDisplay} left)<br>`;
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
            
            // Get currency
            const currencySelect = document.getElementById(`currency-${accountType}`);
            const currency = currencySelect ? currencySelect.value : 'usd';
            
            // Get interest rate if applicable
            const rateInput = document.getElementById(`rate-${accountType}`);
            const rate = rateInput ? parseFloat(rateInput.value) || 0 : 0;
            
            // Get remaining months for loan or mortgage
            let remainingMonths = undefined;
            if (accountType === 'loan' || accountType === 'mortgage') {
                const remainingInput = document.getElementById(`remaining-${accountType}`);
                if (remainingInput) {
                    remainingMonths = parseInt(remainingInput.value);
                    // Use defaults if the input is empty or invalid
                    if (!remainingMonths || remainingMonths <= 0) {
                        remainingMonths = accountType === 'loan' ? 60 : 360;
                    }
                }
            }
            
            return { 
                type: accountType, 
                balance: balance, 
                rate: rate,
                remainingMonths: remainingMonths,
                currency: currency
            };
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
                        <li>Check your Lunch Money account to see the new transactions</li>
                        <li><strong>Go to Recurring in Lunch Money and approve the suggested items</strong></li>
                        <li>Lunch Money will automatically detect recurring patterns</li>
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
let uiController;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing UI controller...');
    try {
        uiController = new UIController();
        window.uiController = uiController; // Make it globally accessible
        console.log('UI controller initialized successfully');
    } catch (error) {
        console.error('Failed to initialize UI controller:', error);
    }
});