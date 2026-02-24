// data.js - Data access layer using LocalStorage

const STORAGE_KEY = 'shushi_app_data';

// Initial structure if nothing exists
const initialData = {
    transactions: [], // { id, date(YYYY-MM-DD), type(income|expense), category, amount, note }
    assets: {
        'sumishin': { name: '住信SBIネット銀行', balance: 0 },
        'rakuten': { name: '楽天銀行', balance: 0 },
        'rakuten_sec': { name: '楽天証券', balance: 0 },
        'kyosai': { name: '小規模企業共済', balance: 0 }
    },
    categories: {
        income: ['事業収入', '預金利息', 'その他収入'],
        expense: ['生活費', '雑費', '購入品', '交通費', 'CR', 'クレジット', '税金(所得税)', '税金(住民税)', '税金(個人事業税)', '社会保険'],
        transfer: ['NISA(積立)', 'NISA(成長)', 'iDeCo', '小規模企業共済', '資金移動']
    },
    // 自動生成ルール
    automationRules: {
        monthlyIncome: [
            { category: '事業収入', amount: 1430000, toAccount: 'sumishin', note: '定例' },
            { category: '社会保険', type: 'income', amount: 60000, toAccount: 'sumishin', note: '定例' } // ルール上収入として記載あり
        ],
        monthlyExpense: [
            { category: '生活費', amount: 600000, fromAccount: 'sumishin', note: '定例' },
            { category: '雑費', amount: 100000, fromAccount: 'sumishin', note: '定例' },
            { category: '購入品', amount: 0, fromAccount: 'sumishin', note: '定例' },
            { category: '交通費', amount: 30000, fromAccount: 'sumishin', note: '定例' },
            { category: 'CR', amount: 0, fromAccount: 'sumishin', note: '定例' },
            { category: 'クレジット', amount: 0, fromAccount: 'sumishin', note: '定例(JCB)' },
            { category: 'クレジット', amount: 0, fromAccount: 'rakuten', note: '定例(楽天)' },
            { category: 'NISA(積立)', type: 'transfer', amount: 100000, fromAccount: 'rakuten', toAccount: 'rakuten_sec', note: '定例' },
            { category: 'NISA(成長)', type: 'transfer', amount: 200000, fromAccount: 'rakuten', toAccount: 'rakuten_sec', note: '定例' },
            { category: 'iDeCo', type: 'transfer', amount: 10000, fromAccount: 'rakuten', toAccount: 'rakuten_sec', note: '定例' },
            { category: '小規模企業共済', type: 'transfer', amount: 70000, fromAccount: 'sumishin', toAccount: 'kyosai', note: '定例' },
            { category: '社会保険', type: 'expense', amount: 96000, fromAccount: 'sumishin', note: '定例' },
            { category: '資金移動', type: 'transfer', amount: 550000, fromAccount: 'sumishin', toAccount: 'rakuten', note: '定例' }
        ],
        specificMonths: {
            '2026-03': [
                { category: '税金(所得税)', type: 'expense', amount: 2688500, fromAccount: 'rakuten', note: '予定' }
            ],
            '2026-06': [
                { category: '税金(住民税)', type: 'expense', amount: 356025, fromAccount: 'rakuten', note: '予定' }
            ],
            '2026-08': [
                { category: '税金(住民税)', type: 'expense', amount: 356025, fromAccount: 'rakuten', note: '予定' },
                { category: '税金(個人事業税)', type: 'expense', amount: 341550, fromAccount: 'rakuten', note: '予定' }
            ],
            '2026-10': [
                { category: '税金(住民税)', type: 'expense', amount: 356025, fromAccount: 'rakuten', note: '予定' },
                { category: '税金(個人事業税)', type: 'expense', amount: 341550, fromAccount: 'rakuten', note: '予定' }
            ],
            '2027-01': [
                { category: '事業収入', type: 'income', amount: 396000, toAccount: 'sumishin', note: '予定' },
                { category: '税金(住民税)', type: 'expense', amount: 356025, fromAccount: 'rakuten', note: '予定' }
            ],
            '2027-03': [
                { category: '税金(所得税)', type: 'expense', amount: 3184400, fromAccount: 'rakuten', note: '予定' }
            ]
        },
        generatedMonths: [] // Track which months have had rules applied
    }
};

const DataStore = {
    load() {
        const dataStr = localStorage.getItem(STORAGE_KEY);
        if (!dataStr) {
            this.save(initialData);
            return JSON.parse(JSON.stringify(initialData));
        }
        try {
            const data = JSON.parse(dataStr);
            // Backward compatibility for older local storage data without automationRules
            if (!data.automationRules) {
                data.automationRules = JSON.parse(JSON.stringify(initialData.automationRules));
                this.save(data);
            }
            if (!data.automationRules.generatedMonths) {
                data.automationRules.generatedMonths = [];
                this.save(data);
            }
            return data;
        } catch (e) {
            console.error("Failed to parse data:", e);
            return JSON.parse(JSON.stringify(initialData));
        }
    },

    save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    addTransaction(tx) {
        const data = this.load();
        tx.id = tx.id || Date.now().toString() + Math.random().toString(36).substr(2, 5); // simple unique ID

        // Ensure defaults
        tx.fromAccount = tx.fromAccount || null;
        tx.toAccount = tx.toAccount || null;
        tx.isPlanned = tx.isPlanned || false; // Is this an unverified planned tx?

        data.transactions.push(tx);

        // Process balance updates if it's not just a future plan (or if you want plans to affect current balance)
        // For simplicity, we update real balances immediately. In a complex app, planned txs might only affect "projected balance".
        if (!tx.isPlanned) {
            this.applyTransactionToBalance(data, tx, 1);
        }

        this.save(data);
        return tx;
    },

    updateTransaction(updatedTx) {
        const data = this.load();
        const index = data.transactions.findIndex(t => t.id === updatedTx.id);
        if (index !== -1) {
            // Revert old effect
            const oldTx = data.transactions[index];
            if (!oldTx.isPlanned) {
                this.applyTransactionToBalance(data, oldTx, -1);
            }

            // Apply new
            data.transactions[index] = updatedTx;
            if (!updatedTx.isPlanned) {
                this.applyTransactionToBalance(data, updatedTx, 1);
            }
            this.save(data);
        }
    },

    applyTransactionToBalance(data, tx, multiplier) {
        const amount = Number(tx.amount) * multiplier;
        if (tx.type === 'expense') {
            if (tx.fromAccount && data.assets[tx.fromAccount]) data.assets[tx.fromAccount].balance -= amount;
        } else if (tx.type === 'income') {
            if (tx.toAccount && data.assets[tx.toAccount]) data.assets[tx.toAccount].balance += amount;
        } else if (tx.type === 'transfer') {
            if (tx.fromAccount && data.assets[tx.fromAccount]) data.assets[tx.fromAccount].balance -= amount;
            if (tx.toAccount && data.assets[tx.toAccount]) data.assets[tx.toAccount].balance += amount;
        }
    },

    // Auto-generate planned transactions for a specific month
    generatePlannedTransactions(yearMonth) {
        const data = this.load();

        // Skip if already generated for this month
        if (data.automationRules.generatedMonths.includes(yearMonth)) return;

        const newTxs = [];
        const rules = data.automationRules;
        const [year, month] = yearMonth.split('-');
        const dateStr = `${year}-${month}-01`; // Default generated date

        // 1. Monthly Incomes
        rules.monthlyIncome.forEach(rule => {
            newTxs.push({
                date: dateStr,
                type: rule.type || 'income',
                category: rule.category,
                amount: rule.amount,
                note: rule.note,
                toAccount: rule.toAccount,
                isPlanned: true // Mark as plan
            });
        });

        // 2. Monthly Expenses & Transfers
        rules.monthlyExpense.forEach(rule => {
            newTxs.push({
                date: dateStr,
                type: rule.type || 'expense',
                category: rule.category,
                amount: rule.amount,
                note: rule.note,
                fromAccount: rule.fromAccount,
                toAccount: rule.toAccount,
                isPlanned: true
            });
        });

        // 3. Specific Month Rules
        if (rules.specificMonths[yearMonth]) {
            rules.specificMonths[yearMonth].forEach(rule => {
                newTxs.push({
                    date: dateStr,
                    type: rule.type || 'expense', // default to expense
                    category: rule.category,
                    amount: rule.amount,
                    note: rule.note,
                    fromAccount: rule.fromAccount,
                    toAccount: rule.toAccount,
                    isPlanned: true
                });
            });
        }

        // Add to store
        newTxs.forEach(tx => {
            tx.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            data.transactions.push(tx);
        });

        data.automationRules.generatedMonths.push(yearMonth);
        this.save(data);
    },

    // Get transactions for a specific month (YYYY-MM format)
    getTransactionsByMonth(yearMonth) {
        this.generatePlannedTransactions(yearMonth); // Ensure they are generated when viewed
        const data = this.load();
        return data.transactions.filter(tx => tx.date.startsWith(yearMonth));
    },

    // Calculate totals for a given month
    getMonthSummary(yearMonth) {
        const txs = this.getTransactionsByMonth(yearMonth);
        let income = 0;
        let expense = 0;

        txs.forEach(tx => {
            if (tx.type === 'income') income += Number(tx.amount);
            if (tx.type === 'expense') expense += Number(tx.amount);
        });

        return {
            income,
            expense,
            balance: income - expense
        };
    },

    getTotalAssets() {
        const data = this.load();
        let total = 0;
        for (const key in data.assets) {
            total += Number(data.assets[key].balance);
        }
        return total;
    },

    // For testing: inject mock data based on spreadsheet screenshot
    injectMockData() {
        const mockData = JSON.parse(JSON.stringify(initialData));
        // Reset generation flag for 2026-01 so rules can apply if we want, or inject manually
        // We'll let the generator handle 2026-01 naturally next time it's loaded instead of hardcoding old array

        // Mock Assets Matches
        mockData.assets.sumishin.balance = 537214;
        mockData.assets.rakuten.balance = 1335496;
        mockData.assets.rakuten_sec.balance = 3542512 + 383499; // Combined NISA and iDeCo
        mockData.assets.kyosai.balance = 210000;

        // Force generate 2026-01 to give data immediately
        this.save(mockData);
        this.generatePlannedTransactions('2026-01');
        return this.load();
    }
};

// Expose globally
window.DataStore = DataStore;
