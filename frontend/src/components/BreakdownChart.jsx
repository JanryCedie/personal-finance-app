import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const BreakdownChart = ({ refreshTrigger }) => {
    const [breakdownData, setBreakdownData] = useState([]);
    const [viewType, setViewType] = useState('debit'); // 'credit' or 'debit'

    useEffect(() => {
        fetchBreakdown();
    }, [refreshTrigger]);

    const fetchBreakdown = async () => {
        try {
            const response = await axios.get('/api/report/breakdown');
            setBreakdownData(response.data);
        } catch (error) {
            console.error("Error fetching breakdown", error);
        }
    };

    const filteredData = breakdownData.filter(item => item.type === viewType);

    const data = {
        labels: filteredData.map(item => item.category),
        datasets: [
            {
                data: filteredData.map(item => item.amount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4 self-start">Breakdown</h2>

            <div className="flex space-x-2 mb-6 self-start">
                <button
                    onClick={() => setViewType('credit')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${viewType === 'credit' ? 'bg-green-100 text-green-700 font-bold' : 'bg-gray-100 text-gray-500'}`}
                >
                    Income
                </button>
                <button
                    onClick={() => setViewType('debit')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${viewType === 'debit' ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100 text-gray-500'}`}
                >
                    Expense
                </button>
            </div>

            <div className="w-64 h-64 relative">
                {filteredData.length > 0 ? (
                    <Doughnut data={data} options={{ maintainAspectRatio: false }} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        No data for {viewType}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BreakdownChart;
