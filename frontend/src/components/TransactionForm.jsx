import React, { useState } from 'react';
import axios from 'axios';

const TransactionForm = ({ onTransactionAdded }) => {
    const [type, setType] = useState('credit');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !description) return;
        setLoading(true);
        try {
            await axios.post('/api/transactions/', {
                type,
                amount: parseFloat(amount),
                description
            });
            setAmount('');
            setDescription('');
            onTransactionAdded();
        } catch (error) {
            console.error("Error adding transaction", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex space-x-4 mb-4">
                    <button
                        type="button"
                        onClick={() => setType('credit')}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors duration-200 ${type === 'credit'
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        Credit (Income)
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('debit')}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors duration-200 ${type === 'debit'
                            ? 'bg-red-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        Debit (Expense)
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="0.00"
                        step="0.01"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g. Salary, Groceries"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Adding...' : 'Add Transaction'}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
