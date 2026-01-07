import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const WeeklyReport = ({ refreshTrigger }) => {
    const [reportData, setReportData] = useState([]);

    useEffect(() => {
        fetchReport();
    }, [refreshTrigger]);

    const fetchReport = async () => {
        try {
            const response = await axios.get('/api/report/weekly');
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report", error);
        }
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false,
                text: 'Weekly Financial Report',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    const data = {
        labels: reportData.map(item => `Week of ${item.week}`),
        datasets: [
            {
                label: 'Income',
                data: reportData.map(item => item.credit),
                backgroundColor: 'rgba(34, 197, 94, 0.7)', // Green
                borderRadius: 8,
            },
            {
                label: 'Expense',
                data: reportData.map(item => item.debit),
                backgroundColor: 'rgba(239, 68, 68, 0.7)', // Red
                borderRadius: 8,
            },
        ],
    };

    const totalBalance = reportData.reduce((acc, curr) => acc + curr.balance, 0);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Weekly Report</h2>
                <div className={`px-4 py-1 rounded-full text-sm font-bold ${totalBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Total Balance: ${totalBalance.toFixed(2)}
                </div>
            </div>

            {reportData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    No data available yet
                </div>
            ) : (
                <div className="flex-1 min-h-[300px]">
                    <Bar options={options} data={data} />
                </div>
            )}
        </div>
    );
};

export default WeeklyReport;
