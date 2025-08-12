# 🍽️ Lunch Money Transaction Generator

A web-based tool to generate realistic recurring transactions for Lunch Money testing and demo purposes.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Custom%20Domain-blue)](https://transactiongenerator.projectedcashflow.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## ✨ Features

- **🌐 Web-based**: Runs directly in your browser via GitHub Pages
- **🔒 Secure**: API key stays in your browser - never sent to our servers
- **📊 Realistic Data**: Generates common recurring transactions with accurate calculations
- **🌍 Multi-Currency Support**: Full support for 40+ currencies matching Projected Cash Flow
- **🏠 Mortgage/Loan Calculations**: 
  - Proper amortization with month-by-month principal & interest breakdown
  - Tracks decreasing balance for accurate interest calculations
  - Supports multiple currencies with proper formatting
- **💳 Credit Card Logic**: 
  - Daily compounding (APR/365) for realistic interest charges
  - Minimum payment calculation: 3% of balance + interest
  - Multi-currency support for international cards
- **🎯 Smart Validation**: Checks if your account is empty before generating data
- **🔄 Recurring Detection**: Lunch Money automatically detects patterns in generated transactions
- **🌏 International Patterns**: 
  - Currency-specific transaction patterns (salaries, rent, utilities)
  - Automatic currency routing to correct accounts
  - Proper formatting (e.g., no decimals for JPY)
- **📱 Responsive**: Works on desktop and mobile devices

## 🚀 Quick Start

### Option 1: Use the Live Demo (Recommended)

1. Visit [https://transactiongenerator.projectedcashflow.app/](https://transactiongenerator.projectedcashflow.app/)
2. Enter your Lunch Money API key
3. Configure your preferences
4. Generate transactions!

### Option 2: Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/thetemplateblog/lunchmoney-transaction-generator.git
   cd lunchmoney-transaction-generator
   ```

2. Open `index.html` in your browser or serve it with a local server:
   ```bash
   python -m http.server 8000
   # Or use any other static file server
   ```

3. Navigate to `http://localhost:8000`

## 📋 What Gets Generated

The tool creates realistic recurring transactions including:

### 💰 Income (2 types)
- **Salary Deposit**: $3,250.00 on the 1st of each month
- **Freelance Payment**: $825.50 on the 15th of each month

### 💸 Expenses (8 types)
- **Rent Payment**: $1,450.00 on the 3rd of each month
- **Internet Bill**: $79.99 on the 7th of each month
- **Phone Bill**: $85.25 on the 12th of each month
- **Gym Membership**: $45.00 on the 18th of each month
- **Streaming Service**: $19.99 on the 21st of each month
- **Student Loan**: $315.75 on the 24th of each month
- **Car Insurance**: $135.50 on the 27th of each month
- **Savings Transfer**: $200.00 on the 30th of each month

**Monthly Net**: +$1,743.52 (Income: $4,075.50, Expenses: $2,331.98)

## 🏦 Sample Accounts Created

If no accounts exist, the tool will automatically create:

- **Demo Checking Account**: $5,000.00 starting balance (any currency)
- **Demo Savings Account**: $15,000.00 starting balance (any currency)
- **Demo Credit Card**: -$850.00 starting balance with APR (any currency)
- **Demo Investment Account**: $25,000.00 starting balance (any currency)
- **Demo Loan Account**: -$12,000.00 with customizable term (any currency)
- **Demo Mortgage Account**: -$250,000.00 with P&I breakdown (any currency)
- **Demo Cash Account**: $500.00 starting balance (any currency)

### 🌍 Supported Currencies (40+ currencies matching Projected Cash Flow)

#### Americas
- 🇺🇸 USD - US Dollar
- 🇨🇦 CAD - Canadian Dollar
- 🇲🇽 MXN - Mexican Peso
- 🇧🇷 BRL - Brazilian Real
- 🇦🇷 ARS - Argentine Peso
- 🇨🇱 CLP - Chilean Peso
- 🇨🇴 COP - Colombian Peso
- 🇵🇪 PEN - Peruvian Sol

#### Europe
- 🇪🇺 EUR - Euro
- 🇬🇧 GBP - British Pound
- 🇨🇭 CHF - Swiss Franc
- 🇸🇪 SEK - Swedish Krona
- 🇳🇴 NOK - Norwegian Krone
- 🇩🇰 DKK - Danish Krone
- 🇵🇱 PLN - Polish Złoty
- 🇨🇿 CZK - Czech Koruna
- 🇷🇺 RUB - Russian Ruble
- 🇺🇦 UAH - Ukrainian Hryvnia

#### Asia-Pacific
- 🇯🇵 JPY - Japanese Yen
- 🇨🇳 CNY - Chinese Yuan
- 🇰🇷 KRW - South Korean Won
- 🇦🇺 AUD - Australian Dollar
- 🇳🇿 NZD - New Zealand Dollar
- 🇸🇬 SGD - Singapore Dollar
- 🇭🇰 HKD - Hong Kong Dollar
- 🇮🇳 INR - Indian Rupee
- 🇹🇭 THB - Thai Baht
- 🇲🇾 MYR - Malaysian Ringgit
- 🇵🇭 PHP - Philippine Peso
- 🇮🇩 IDR - Indonesian Rupiah
- 🇻🇳 VND - Vietnamese Dong

#### Middle East & Africa
- 🇦🇪 AED - UAE Dirham
- 🇸🇦 SAR - Saudi Riyal
- 🇮🇱 ILS - Israeli Shekel
- 🇿🇦 ZAR - South African Rand
- 🇳🇬 NGN - Nigerian Naira
- 🇰🇪 KES - Kenyan Shilling
- 🇪🇬 EGP - Egyptian Pound
- 🇹🇷 TRY - Turkish Lira

All transactions will be created in the checking account with proper currency support.

## 🔧 Configuration Options

- **Recurring Items**: Choose how many recurring transactions to create (1-10, default: 10)
- **Duration**: Generate 1-24 months of data (default: 3)
- **Account Types**: Select which types of accounts to create with customizable balances and currencies:
  - Checking Account (default: $5,000, any currency)
  - Savings Account (default: $15,000, any currency)
  - Credit Card (default: -$850, 16% APR, daily compounding) - automatically adds minimum payments
  - Investment Account (default: $25,000, any currency)
  - Loan Account (default: -$12,000, 10% APR, monthly compounding) - fixed monthly payments
  - Cash Account (default: $500, any currency)
  - Mortgage Account (default: -$250,000, 7% APR) - shows exact P&I breakdown each month
- **Currency Selection**: Choose from 40+ world currencies for each account (all currencies supported by Projected Cash Flow)
- **International Presets**: Quick setups for:
  - 🇪🇺 EUR - European accounts with mortgage
  - 🇬🇧 GBP - UK accounts with housing costs
  - 🇯🇵 JPY - Japanese accounts (no decimals)
  - 🇨🇦 CAD - Canadian accounts with mortgage
  - 🇦🇺 AUD - Australian accounts
  - 🇸🇬 SGD - Singapore accounts with investments
  - 🌏 Mix - Multi-currency portfolio example
- **Start Date**: Choose when to begin the transaction history
- **Account Validation**: Automatic checking for empty accounts
- **Real-time Preview**: See exactly what will be created before generating with proper currency formatting

## 🛡️ Security & Privacy

- **Client-side Only**: All processing happens in your browser
- **No Data Storage**: Your API key and data are never stored or transmitted to our servers
- **Open Source**: Full transparency - inspect the code yourself
- **HTTPS Only**: Secure communication with Lunch Money's API

## 🎯 Use Cases

- **Testing**: Perfect for testing Lunch Money's budgeting and reporting features
- **Demos**: Great for showcasing Lunch Money's capabilities - works perfectly for demonstrating cash flow apps like [projectedcashflow.app](https://projectedcashflow.app)
- **Learning**: Understand how recurring transactions work
- **Development**: Test integrations with realistic data

## 🚀 Quick Setup for New Accounts

For the best experience, we recommend starting with a fresh Lunch Money account:

1. **Sign up** for a new account at [lunchmoney.app](https://lunchmoney.app)
2. **During setup**, choose **"Skip the walkthrough"**
   - This gives you a completely blank slate with no pre-configured categories or accounts
   - The tool will automatically create sample accounts and categories as needed
   - Perfect for this demo tool to create realistic sample data
3. **Get your API key** (see instructions below)

📖 **Learn more**: [Lunch Money Getting Started Guide](https://support.lunchmoney.app/getting-started)

## 🔑 Getting Your API Key

1. Log in to [Lunch Money](https://my.lunchmoney.app/)
2. Go to **Settings** → **Developers**
3. Create a new API key
4. Copy the key and paste it into the tool

> **⚠️ Important**: This tool is designed for testing accounts. While it's safe to use with real accounts, consider creating a separate test account for experimentation.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone the repo
git clone https://github.com/thetemplateblog/lunchmoney-transaction-generator.git
cd lunchmoney-transaction-generator

# No build process needed - it's all vanilla HTML/CSS/JS!
# Just open index.html in your browser or use a local server
```

## 📚 Technical Details

### Architecture

- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **API Integration**: Direct calls to Lunch Money's REST API
- **No Backend**: Entirely client-side for security and simplicity

### Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Android Chrome
- **Requirements**: ES6+ support, Fetch API

### API Usage

The tool uses the following Lunch Money API endpoints:

- `GET /v1/me` - Validate API key
- `GET /v1/assets` - Find checking account
- `GET /v1/categories` - Get/create categories
- `GET /v1/transactions` - Check existing transactions
- `POST /v1/transactions` - Create new transactions with currency support
- `POST /v1/categories` - Create missing categories
- `POST /v1/assets` - Create accounts with specific currencies

### Calculation Methods

- **Mortgages**: 
  - Monthly compounding with accurate P&I split
  - Balance decreases each month for proper interest calculation
  - Example: $250k at 7% shows $1,458 interest month 1, $1,457 month 2, etc.
- **Loans**: 
  - Standard amortization formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
  - Fixed monthly payments with decreasing interest portion
- **Credit Cards**: 
  - Daily periodic rate: APR/365
  - Effective monthly rate: (1 + daily_rate)^30 - 1
  - Minimum payment: max(3% of balance, $25) + interest
- **Multi-Currency**: 
  - Proper formatting for each currency (e.g., ¥500,000 not ¥500,000.00)
  - Currency-specific accounts for proper routing
  - International transaction patterns for realistic data

## 🐛 Troubleshooting

### Common Issues

**"Invalid API Key"**
- Double-check your API key from Lunch Money settings
- Ensure there are no extra spaces

**"No checking account found"**
- Make sure you have at least one cash/checking account in Lunch Money
- The tool looks for accounts with "checking" in the name

**"Failed to create transactions"**
- Check your internet connection
- Verify your API key hasn't expired
- Try refreshing the page and starting over

**CORS Issues (Local Development)**
- Use a local server instead of opening the file directly
- Try: `python -m http.server` or `npx serve`

## 📝 Recent Updates

### Version 2.0 - Multi-Currency & Enhanced Calculations
- **40+ Currency Support**: Added full support for all currencies used by Projected Cash Flow
- **Improved Mortgage Calculations**: Month-by-month P&I breakdown with decreasing balance
- **Enhanced Loan Amortization**: Proper formulas matching debt snowball calculations
- **Credit Card Accuracy**: Daily compounding for realistic minimum payments
- **International Presets**: 7 quick setup options for different countries
- **Currency-Specific Accounts**: Automatic routing to correct currency accounts
- **International Patterns**: Realistic transactions for EUR, GBP, JPY, CAD, AUD, SGD, and more

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to [Lunch Money](https://lunchmoney.app/) for providing an excellent API
- Inspired by the need for realistic test data in financial applications
- Built with ❤️ for the Lunch Money community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/thetemplateblog/lunchmoney-transaction-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/thetemplateblog/lunchmoney-transaction-generator/discussions)

---

**⭐ Found this helpful? Give it a star!**