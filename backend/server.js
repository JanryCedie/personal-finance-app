const express = require('express');
const cors = require('cors');
const connectDB = require('./database');
const Transaction = require('./models/Transaction');

const app = express();
const PORT = process.env.PORT || 8000; // Vercel sets PORT

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

// Get all transactions
app.get('/transactions/', async (req, res) => {
    try {
        const { skip = 0, limit = 100 } = req.query;
        // Skip and limit need to be integers
        const skipInt = parseInt(skip);
        const limitInt = parseInt(limit);

        const transactions = await Transaction.find()
            .sort({ date: 1 }) // sort by date ascending? Python code didn't explicitly sort list, just offsets. 
            // Weekly report sorted by week.
            // Let's just return default order or by date.
            .skip(skipInt)
            .limit(limitInt);

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create transaction
app.post('/transactions/', async (req, res) => {
    try {
        const { type, amount, description } = req.body;
        const transaction = new Transaction({
            type,
            amount,
            description
            // date defaults to now in model
        });

        const savedTransaction = await transaction.save();
        res.json(savedTransaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete transaction
app.delete('/transactions/:id', async (req, res) => {
    try {
        const result = await Transaction.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ detail: "Transaction not found" });
        }
        res.json({ message: "Transaction deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Weekly Report
app.get('/report/weekly', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        const weeklyData = {};

        transactions.forEach(t => {
            const dateObj = new Date(t.date);
            const day = dateObj.getDay();
            // MongoDB/JS Dates are same.
            // Python logic: week_start = date - weekday() (Monday=0)
            // JS getDay(): Sunday=0, Monday=1
            const jsDay = dateObj.getDay();
            const pythonWeekday = jsDay === 0 ? 6 : jsDay - 1;

            const weekStart = new Date(dateObj);
            weekStart.setDate(dateObj.getDate() - pythonWeekday);

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Breakdown Report
app.get('/report/breakdown', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        const breakdown = { credit: {}, debit: {} };

        transactions.forEach(t => {
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
        Object.keys(breakdown).forEach(type => {
            Object.keys(breakdown[type]).forEach(cat => {
                result.push({ type: type, category: cat, amount: breakdown[type][cat] });
            });
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export app for Vercel
module.exports = app;

// Only listen if run directly (node server.js), not when imported by Vercel
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
