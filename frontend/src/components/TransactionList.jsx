import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const TransactionList = ({ refreshTrigger, onTransactionDeleted }) => {
    const [transactions, setTransactions] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        fetchTransactions();
    }, [refreshTrigger]);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('/api/transactions/?limit=10');
            const sorted = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(sorted);
            setSelectedIds([]); // Clear selection on refresh
        } catch (error) {
            console.error("Error fetching transactions", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        try {
            await axios.delete(`/api/transactions/${id}`);
            onTransactionDeleted(); // Trigger refresh
            fetchTransactions();
        } catch (error) {
            console.error("Error deleting transaction", error);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} transactions?`)) return;
        try {
            // Parallel deletes for simplicity (or implement bulk delete API later)
            await Promise.all(selectedIds.map(id => axios.delete(`/api/transactions/${id}`)));
            onTransactionDeleted();
            fetchTransactions();
        } catch (error) {
            console.error("Bulk delete error", error);
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
                {selectedIds.length > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                        Delete Selected ({selectedIds.length})
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-white text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                {/* Header checkbox could go here */}
                            </th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {transactions.map((t) => (
                            <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(t.id) ? 'bg-blue-50/50' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(t.id)}
                                        onChange={() => toggleSelection(t.id)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {format(new Date(t.date), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {t.description}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {t.type.toUpperCase()}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                        title="Delete Transaction"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                        <p>No transactions found</p>
                        <p className="text-xs mt-2">Add a new one to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionList;
