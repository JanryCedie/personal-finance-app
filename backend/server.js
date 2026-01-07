const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Get all transactions
app.get('/transactions/', (req, res) => {
    const { skip = 0, limit = 100 } = req.query;
    const sql = `SELECT * FROM transactions LIMIT ? OFFSET ?`;
    db.all(sql, [limit, skip], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// Create transaction
app.post('/transactions/', (req, res) => {
    const { type, amount, description } = req.body;
    // Date handled by default CURRENT_TIMESTAMP, or we can insert current date in ISO format
    // Python used datetime.datetime.utcnow which is UTC.
    // Let's use ISO string for consistency if we insert from JS.
    const date = new Date().toISOString();

    // However, the table might rely on default. Let's pass it explicitly to match Python's behavior of setting it on creation if needed,
    // but Python model had `default=datetime.datetime.utcnow`. 
    // The previous Python code inserted `id`, `type`, `amount`, `description`, `date` (auto).
    // Let's rely on SQLite default if we defined it, or pass it.
    // In database.js we defined DEFAULT CURRENT_TIMESTAMP.

    const sql = `INSERT INTO transactions (type, amount, description, date) VALUES (?,?,?,?)`;
    const params = [type, amount, description, date];

    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            id: this.lastID,
            type,
            amount,
            description,
            date
        });
    });
});

// Delete transaction
app.delete('/transactions/:id', (req, res) => {
    const sql = `DELETE FROM transactions WHERE id = ?`;
    db.run(sql, req.params.id, function (err, result) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        // this.changes gives rows affected
        if (this.changes === 0) {
            res.status(404).json({ "detail": "Transaction not found" }); // Match Python error detail
            return;
        }
        res.json({ "message": "Transaction deleted successfully" });
    });
});

// Weekly Report
app.get('/report/weekly', (req, res) => {
    const sql = `SELECT * FROM transactions`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        const weeklyData = {};

        rows.forEach(t => {
            // t.date might be a string "YYYY-MM-DD HH:MM:SS" or ISO
            const dateObj = new Date(t.date);
            // Get Monday of the week
            const day = dateObj.getDay(); // 0 is Sunday
            const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            // Note: Python code: week_start = t.date - datetime.timedelta(days=t.date.weekday())
            // Python weekday(): Monday is 0, Sunday is 6.
            // JS getDay(): Sunday is 0, Monday is 1.
            // So Python's logic: date - weekday.
            // JS equivalent: date - (day === 0 ? 6 : day - 1).

            const jsDay = dateObj.getDay();
            const pythonWeekday = jsDay === 0 ? 6 : jsDay - 1;

            const weekStart = new Date(dateObj);
            weekStart.setDate(dateObj.getDate() - pythonWeekday);

            // Format YYYY-MM-DD
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { credit: 0, debit: 0, balance: 0 };
            }

            if (t.type === 'credit') {
                weeklyData[weekKey].credit += t.amount;
                weeklyData[weekKey].balance += t.amount;
            } else if (t.type === 'debit') {
                weeklyData[weekKey].debit += t.amount;
                weeklyData[weekKey].balance -= t.amount;
            }
        });

        const report = Object.keys(weeklyData).map(k => ({
            week: k,
            ...weeklyData[k]
        }));

        report.sort((a, b) => a.week.localeCompare(b.week));

        res.json(report);
    });
});

// Breakdown Report
app.get('/report/breakdown', (req, res) => {
    const sql = `SELECT * FROM transactions`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        const breakdown = { credit: {}, debit: {} };

        rows.forEach(t => {
            const category = t.description ? t.description.trim().replace(/^\w/, c => c.toUpperCase()) : "Uncategorized";
            const typeKey = t.type;

            if (breakdown[typeKey]) {
                if (!breakdown[typeKey][category]) {
                    breakdown[typeKey][category] = 0;
                }
                breakdown[typeKey][category] += t.amount;
            }
        });

        const result = [];
        for (const type in breakdown) {
            for (const category in breakdown[type]) {
                result.append({ type, category, amount: breakdown[type][category] });
            }
        }
        // Wait, JS result.append is result.push
        const finalResult = [];
        Object.keys(breakdown).forEach(type => {
            Object.keys(breakdown[type]).forEach(cat => {
                finalResult.push({ type: type, category: cat, amount: breakdown[type][cat] });
            });
        });

        res.json(finalResult);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
