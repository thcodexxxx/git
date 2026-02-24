document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme Toggle ----
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('shushi-theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggleBtn.innerHTML = "<i class='bx bx-sun'></i>";
    }

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
            body.classList.replace('light-theme', 'dark-theme');
            localStorage.setItem('shushi-theme', 'dark');
            themeToggleBtn.innerHTML = "<i class='bx bx-moon'></i>";
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('shushi-theme', 'light');
            themeToggleBtn.innerHTML = "<i class='bx bx-sun'></i>";
        }
    });

    // ---- View Navigation ----
    const navLinks = document.querySelectorAll('.nav-links a');
    const views = document.querySelectorAll('.view');
    const viewTitle = document.getElementById('view-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');

            // Hide all views
            views.forEach(v => v.classList.remove('active-view'));

            // Show selected view
            const targetViewId = link.getAttribute('data-view');
            document.getElementById(`${targetViewId}-view`).classList.add('active-view');

            // Update Title
            viewTitle.textContent = link.querySelector('.links_name').textContent;
        });
    });

    // ---- Modal Logic ----
    const quickAddBtn = document.getElementById('quick-add-btn');
    const quickAddModal = document.getElementById('quick-add-modal');
    const closeBtn = document.querySelector('.close-modal');

    quickAddBtn.addEventListener('click', () => {
        quickAddModal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        quickAddModal.classList.remove('active');
    });

    // Close on outside click
    quickAddModal.addEventListener('click', (e) => {
        if (e.target === quickAddModal) {
            quickAddModal.classList.remove('active');
        }
    });

    // ---- Data Binding & UI Updates ----
    let currentYearMonth = '2026-01'; // Default for testing to match screenshot

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
    };

    const updateDashboard = () => {
        // 月ごとのサマリ（予定も含む）
        const summary = window.DataStore.getMonthSummary(currentYearMonth);
        const totalAssets = window.DataStore.getTotalAssets();

        // 予定分と確定分を分けてダッシュボードに表示する処理の追加
        const txs = window.DataStore.getTransactionsByMonth(currentYearMonth);
        let actualIncome = 0;
        let actualExpense = 0;

        txs.forEach(tx => {
            if (!tx.isPlanned) {
                if (tx.type === 'income') actualIncome += tx.amount;
                if (tx.type === 'expense') actualExpense += tx.amount;
                // 'transfer' does not sum into actualIncome or actualExpense
            }
        });

        // ダッシュボード更新
        // (総額 = 確定 + 予定)
        document.getElementById('dash-income').innerHTML = `${formatCurrency(summary.income)} <br><span style="font-size: 12px; color: var(--current-text-muted);">(うち確定: ${formatCurrency(actualIncome)})</span>`;
        document.getElementById('dash-expense').innerHTML = `${formatCurrency(summary.expense)} <br><span style="font-size: 12px; color: var(--current-text-muted);">(うち確定: ${formatCurrency(actualExpense)})</span>`;
        document.getElementById('dash-balance').textContent = formatCurrency(summary.balance);
        document.getElementById('dash-total-assets').textContent = formatCurrency(totalAssets);
    };

    const updateMonthlyView = () => {
        // Update Title
        const [year, month] = currentYearMonth.split('-');
        document.getElementById('current-month-display').textContent = `${year}年 ${parseInt(month)}月`;

        // Update Table & Badges Calculations
        const txs = window.DataStore.getTransactionsByMonth(currentYearMonth);

        let rakutenSecAmount = 0;
        let kyosaiAmount = 0;

        txs.forEach(tx => {
            if (tx.type === 'transfer') {
                if (tx.toAccount === 'rakuten_sec') rakutenSecAmount += tx.amount;
                if (tx.toAccount === 'kyosai') kyosaiAmount += tx.amount;
            }
        });

        // Update Badges
        const summary = window.DataStore.getMonthSummary(currentYearMonth);
        document.getElementById('monthly-badge-in').textContent = formatCurrency(summary.income);
        document.getElementById('monthly-badge-out').textContent = formatCurrency(summary.expense);
        document.getElementById('monthly-badge-rakuten-sec').textContent = formatCurrency(rakutenSecAmount);
        document.getElementById('monthly-badge-kyosai').textContent = formatCurrency(kyosaiAmount);

        // Update Table
        const tbody = document.getElementById('transaction-list');
        tbody.innerHTML = '';

        // Sort by date descending
        txs.sort((a, b) => new Date(b.date) - new Date(a.date));

        txs.forEach(tx => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--current-glass-border)';
            // Planned tx styles
            const opacity = tx.isPlanned ? '0.6' : '1';
            // Badge and value styles
            let badgeLabel = '';
            let badgeBg = '';
            let badgeColor = '';
            let amountText = formatCurrency(tx.amount);
            let amountColor = 'var(--current-text)';

            if (tx.type === 'income') {
                badgeLabel = '収入';
                badgeBg = 'rgba(16,185,129,0.1)';
                badgeColor = 'var(--success-color)';
                amountColor = 'var(--success-color)';
            } else if (tx.type === 'expense') {
                badgeLabel = '支出';
                badgeBg = 'rgba(239,68,68,0.1)';
                badgeColor = 'var(--danger-color)';
                amountColor = 'var(--danger-color)';
                amountText = `-${formatCurrency(tx.amount)}`; // minus sign for expense
            } else if (tx.type === 'transfer') {
                badgeLabel = '移動';
                badgeBg = 'rgba(148,163,184,0.1)';
                badgeColor = 'var(--text-muted)';
            }

            if (tx.isPlanned) {
                badgeLabel = `予定 (${badgeLabel})`;
                badgeBg = 'rgba(245, 158, 11, 0.1)';
                badgeColor = 'var(--warning-color)';
            }

            // Render accounts if transfer
            let accountInfo = '';
            if (tx.fromAccount || tx.toAccount) {
                const f = tx.fromAccount ? window.DataStore.load().assets[tx.fromAccount]?.name || tx.fromAccount : '-';
                const t = tx.toAccount ? window.DataStore.load().assets[tx.toAccount]?.name || tx.toAccount : '-';
                accountInfo = `<br><span style="font-size: 10px; color: var(--current-text-muted);">${f} ➔ ${t}</span>`;
            }

            tr.innerHTML = `
                <td style="padding: 12px; opacity: ${opacity};">${tx.date.substring(5)}</td>
                <td style="padding: 12px; opacity: ${opacity};">
                    <span style="font-size: 12px; padding: 3px 8px; border-radius: 12px; background: ${badgeBg}; color: ${badgeColor};">
                        ${badgeLabel}
                    </span>
                    ${accountInfo}
                </td>
                <td style="padding: 12px; opacity: ${opacity};">${tx.category} <span style="font-size: 10px; color: var(--current-text-muted);">${tx.note}</span></td>
                <td style="padding: 12px; font-weight: 600; color: ${amountColor}; opacity: ${opacity};">
                    ${amountText}
                </td>
                <td style="padding: 12px;">
                    ${tx.isPlanned ? `<button class="confirm-tx-btn" data-id="${tx.id}" style="background: var(--accent-color); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">確定/修正</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add event listeners to confirm buttons
        document.querySelectorAll('.confirm-tx-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                openEditModal(id);
            });
        });

        if (txs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--current-text-muted);">データがありません</td></tr>`;
        }
    };

    const updateAssetsView = () => {
        const data = window.DataStore.load();

        // --- Calculate Projected Balances up to the currently displayed month ---
        // 1. Get raw base balances from data.assets
        const projectedAssets = JSON.parse(JSON.stringify(data.assets));

        // 2. We want to show the balance AS OF the 'currentYearMonth'.
        // To do this simply, we take current raw balances, and we need to ADD the effect of ALL 
        // planned transactions that happen from "today" up to the end of currently viewed month,
        // OR if the viewed month is in the past, SUBTRACT the effects of planned/real txs after that month.
        // For a more robust app, "Base Balance" + "All Txs up to viewed month" is better.
        // For now, we will just calculate based on "Real balance + Planned Txs up to viewed month":

        let projectedTotal = window.DataStore.getTotalAssets(); // Real total now

        const allTxs = data.transactions;
        allTxs.forEach(tx => {
            // Include effect if it's a planned transaction AND its date is <= our currently viewed month
            if (tx.isPlanned && tx.date.substring(0, 7) <= currentYearMonth) {
                const amount = Number(tx.amount);
                if (tx.type === 'expense') {
                    if (tx.fromAccount && projectedAssets[tx.fromAccount]) {
                        projectedAssets[tx.fromAccount].balance -= amount;
                        projectedTotal -= amount;
                    }
                    if (tx.toAccount && projectedAssets[tx.toAccount]) {
                        projectedAssets[tx.toAccount].balance += amount;
                        projectedTotal += amount;
                    }
                } else if (tx.type === 'transfer') {
                    if (tx.toAccount && projectedAssets[tx.toAccount]) {
                        projectedAssets[tx.toAccount].balance += amount;
                        // Transfer doesn't change total assets (it nets out), unless money moves out of untracked space, but simpler this way
                        if (!tx.fromAccount) projectedTotal += amount;
                    }
                    if (tx.fromAccount && projectedAssets[tx.fromAccount]) {
                        projectedAssets[tx.fromAccount].balance -= amount;
                        if (!tx.toAccount) projectedTotal -= amount;
                    }
                }
            }
        });

        document.getElementById('assets-total-view').textContent = formatCurrency(projectedTotal);

        const assetsList = document.getElementById('assets-list');
        assetsList.innerHTML = '';

        for (const [key, asset] of Object.entries(projectedAssets)) {
            const div = document.createElement('div');
            div.style.padding = '20px';
            div.style.borderRadius = '12px';
            div.style.background = 'rgba(255,255,255,0.05)';
            div.style.border = '1px solid var(--current-glass-border)';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';

            div.innerHTML = `
                <div>
                    <h4 style="font-size: 14px; color: var(--current-text-muted); font-weight: 500;">${asset.name}</h4>
                </div>
                <div style="font-size: 20px; font-weight: 600;">${formatCurrency(asset.balance)}</div>
            `;
            assetsList.appendChild(div);
        }
    };

    const refreshAllViews = () => {
        updateDashboard();
        updateMonthlyView();
        updateAssetsView();
    };

    // ---- Month Navigation ----
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        const [y, m] = currentYearMonth.split('-');
        let date = new Date(y, parseInt(m) - 2, 1); // -2 because months are 0-indexed in JS
        currentYearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        refreshAllViews();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        const [y, m] = currentYearMonth.split('-');
        let date = new Date(y, parseInt(m), 1);
        currentYearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        refreshAllViews();
    });

    // ---- Form Handling & Edit ----
    const form = document.getElementById('add-tx-form');
    const typeRadios = document.getElementsByName('tx_type');
    const categorySelect = document.getElementById('tx_category');
    let editingTxId = null; // Track if we are editing

    // Set default date to today for quick add
    document.getElementById('tx_date').valueAsDate = new Date();

    const populateCategories = () => {
        const data = window.DataStore.load();
        const type = Array.from(typeRadios).find(r => r.checked).value;
        const categories = data.categories[type] || [];

        categorySelect.innerHTML = '';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
        });
    };

    typeRadios.forEach(r => r.addEventListener('change', populateCategories));

    window.openEditModal = (id) => {
        const data = window.DataStore.load();
        const tx = data.transactions.find(t => t.id === id);
        if (!tx) return;

        editingTxId = id;
        document.getElementById('tx_date').value = tx.date;
        document.querySelector(`input[name="tx_type"][value="${tx.type}"]`).checked = true;
        populateCategories(); // Update dropdown
        document.getElementById('tx_category').value = tx.category;
        document.getElementById('tx_amount').value = tx.amount;
        document.getElementById('tx_note').value = tx.note || '';

        // Change modal title implicitly
        document.querySelector('.modal-header h3').textContent = tx.isPlanned ? '予定を確定 / 修正' : '取引を編集';
        document.getElementById('tx_from_account').value = tx.fromAccount || '';
        document.getElementById('tx_to_account').value = tx.toAccount || '';
        quickAddModal.classList.add('active');
    };

    // Override + button to reset state
    quickAddBtn.addEventListener('click', () => {
        editingTxId = null;
        form.reset();
        document.getElementById('tx_date').valueAsDate = new Date();
        document.getElementById('tx_from_account').value = '';
        document.getElementById('tx_to_account').value = '';
        document.querySelector('.modal-header h3').textContent = '取引を追加';
        populateCategories();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const tx = {
            date: document.getElementById('tx_date').value,
            type: Array.from(typeRadios).find(r => r.checked).value,
            category: document.getElementById('tx_category').value,
            amount: parseInt(document.getElementById('tx_amount').value, 10),
            note: document.getElementById('tx_note').value,
            fromAccount: document.getElementById('tx_from_account').value || null,
            toAccount: document.getElementById('tx_to_account').value || null,
            isPlanned: false // Always marks as real transaction upon save
        };

        if (editingTxId) {
            tx.id = editingTxId;
            window.DataStore.updateTransaction(tx);
        } else {
            window.DataStore.addTransaction(tx);
        }

        // Reset form
        form.reset();

        quickAddModal.classList.remove('active');
        refreshAllViews();

        const btn = document.getElementById('quick-add-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class='bx bx-check'></i> 保存完了`;
        btn.style.backgroundColor = 'var(--success-color)';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    });

    // ---- Mock Data Injection ----
    const injectBtn = document.getElementById('inject-mock-btn');
    if (injectBtn) {
        injectBtn.addEventListener('click', () => {
            if (confirm('テスト用のモックデータをLocal Storageに注入しますか？既存のデータは上書きされます。')) {
                window.DataStore.injectMockData();
                refreshAllViews();
                alert('データを注入しました！');
            }
        });
    }

    // Initial Load
    window.DataStore.load();
    populateCategories();
    // 最初の読み込み時に現在のデフォルト月に合わせた予定データを生成してからビューを更新する
    window.DataStore.generatePlannedTransactions(currentYearMonth);
    refreshAllViews();
});
