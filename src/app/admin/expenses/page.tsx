"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ExpensesDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Initialize from URL or default to current month
    const initialMonth = searchParams.get('date') || new Date().toISOString().slice(0, 7);
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth); // YYYY-MM
    const [filterType, setFilterType] = useState<string>('all');
    const [showReport, setShowReport] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // Sync state if URL changes (e.g. back button)
    useEffect(() => {
        const dateParam = searchParams.get('date');
        if (dateParam && dateParam !== selectedMonth) {
            setSelectedMonth(dateParam);
        }
    }, [searchParams]);

    // Update URL when month changes
    const handleMonthChange = (newMonth: string) => {
        setSelectedMonth(newMonth);
        setShowReport(false);
        router.replace(`/admin/expenses?date=${newMonth}`, { scroll: false });
    };
    
    // ... (rest of code)
    
    // In the return JSX, update onChange handlers to use handleMonthChange
    // ...
                    <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-500">Month:</label>
                    <select
                        value={parseInt(selectedMonth.split('-')[1])}
                        onChange={(e) => {
                            const newMonthStr = e.target.value.padStart(2, '0');
                            const year = selectedMonth.split('-')[0];
                            handleMonthChange(`${year}-${newMonthStr}`);
                        }}
                        className="border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-700 py-2 pl-3 pr-8"
                    >
                        {[
                            "January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"
                        ].map((month, i) => (
                            <option key={i + 1} value={i + 1}>{month}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-500">Year:</label>
                    <select
                        value={parseInt(selectedMonth.split('-')[0])}
                        onChange={(e) => {
                            const newYear = e.target.value;
                            const month = selectedMonth.split('-')[1];
                            handleMonthChange(`${newYear}-${month}`);
                        }}
                        className="border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-700 py-2 pl-3 pr-8"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-arrow-up text-6xl text-green-500"></i>
                    </div>
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Total Income</p>
                    <p className="text-3xl font-extrabold text-gray-900">
                        {totalIncome.toLocaleString('vi-VN')} ₫
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-arrow-down text-6xl text-red-500"></i>
                    </div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Total Expense</p>
                    <p className="text-3xl font-extrabold text-gray-900">
                        {totalExpense.toLocaleString('vi-VN')} ₫
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-wallet text-6xl text-blue-500"></i>
                    </div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Net Balance</p>
                    <p className={`text-3xl font-extrabold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {netBalance.toLocaleString('vi-VN')} ₫
                    </p>
                </div>
            </div>

            {/* Detailed Report Section */}
            {showReport && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-down">
                    <div className="p-6 border-b border-gray-100 bg-blue-50/50 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-900">
                            <i className="fas fa-file-invoice-dollar text-blue-500 mr-2"></i>
                            Monthly Financial Report - {new Date(selectedMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => window.print()} className="text-gray-500 hover:text-blue-600 print:hidden" title="Print Report">
                            <i className="fas fa-print text-lg"></i>
                        </button>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Table */}
                        <div>
                            <h3 className="font-bold text-green-700 mb-4 border-b border-green-100 pb-2">Income Analysis</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-green-50 text-green-800">
                                    <tr>
                                        <th className="px-3 py-2 text-left rounded-l-md">Category</th>
                                        <th className="px-3 py-2 text-right">Amount</th>
                                        <th className="px-3 py-2 text-right rounded-r-md">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {/* Real Income Section */}
                                    {realIncomeBreakdown.length > 0 && (
                                        <>
                                            <tr className="bg-green-50/50">
                                                <td colSpan={3} className="px-3 py-1.5 text-xs font-bold text-green-600 uppercase tracking-wide">
                                                    Real Income (Salary & Balance)
                                                </td>
                                            </tr>
                                            {realIncomeBreakdown.map(item => (
                                                <tr key={item.name}>
                                                    <td className="px-3 py-2 font-medium text-gray-700 pl-6">{item.name}</td>
                                                    <td className="px-3 py-2 text-right text-gray-900">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                                    <td className="px-3 py-2 text-right text-gray-500">{item.percentage.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold bg-green-50/20 text-xs">
                                                <td className="px-3 py-2 text-green-700 pl-6">Subtotal Real Income</td>
                                                <td className="px-3 py-2 text-right text-green-700">{realIncomeTotal.toLocaleString('vi-VN')} ₫</td>
                                                <td className="px-3 py-2 text-right"></td>
                                            </tr>
                                        </>
                                    )}

                                    {/* Circulating Income Section */}
                                    {circulatingIncomeBreakdown.length > 0 && (
                                        <>
                                            <tr className="bg-blue-50/50">
                                                <td colSpan={3} className="px-3 py-1.5 text-xs font-bold text-blue-600 uppercase tracking-wide mt-2">
                                                    Circulating Income (Others)
                                                </td>
                                            </tr>
                                            {circulatingIncomeBreakdown.map(item => (
                                                <tr key={item.name}>
                                                    <td className="px-3 py-2 font-medium text-gray-700 pl-6">{item.name}</td>
                                                    <td className="px-3 py-2 text-right text-gray-900">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                                    <td className="px-3 py-2 text-right text-gray-500">{item.percentage.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold bg-blue-50/20 text-xs">
                                                <td className="px-3 py-2 text-blue-700 pl-6">Subtotal Circulating</td>
                                                <td className="px-3 py-2 text-right text-blue-700">{circulatingIncomeTotal.toLocaleString('vi-VN')} ₫</td>
                                                <td className="px-3 py-2 text-right"></td>
                                            </tr>
                                        </>
                                    )}

                                    {/* Grand Total */}
                                    <tr className="font-bold bg-green-100/50 border-t-2 border-green-100">
                                        <td className="px-3 py-3 text-green-900">Grand Total Income</td>
                                        <td className="px-3 py-3 text-right text-green-900">{totalIncome.toLocaleString('vi-VN')} ₫</td>
                                        <td className="px-3 py-3 text-right">100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Expense Table */}
                        <div>
                            <h3 className="font-bold text-red-700 mb-4 border-b border-red-100 pb-2">Expense Analysis</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-red-50 text-red-800">
                                    <tr>
                                        <th className="px-3 py-2 text-left rounded-l-md">Category</th>
                                        <th className="px-3 py-2 text-right">Amount</th>
                                        <th className="px-3 py-2 text-right rounded-r-md">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {expenseBreakdown.map(item => (
                                        <tr key={item.name}>
                                            <td className="px-3 py-2 font-medium text-gray-700">{item.name}</td>
                                            <td className="px-3 py-2 text-right text-gray-900">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                            <td className="px-3 py-2 text-right text-gray-500">{item.percentage.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold bg-red-50/30">
                                        <td className="px-3 py-2 text-red-800">Total Expense</td>
                                        <td className="px-3 py-2 text-right text-red-700">{totalExpense.toLocaleString('vi-VN')} ₫</td>
                                        <td className="px-3 py-2 text-right">100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Income Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                        Income Sources
                    </h3>
                    <div className="space-y-4 flex-1">
                        {incomeBreakdown.length > 0 ? incomeBreakdown.map((stat) => (
                            <div key={stat.name}>
                                <div className="flex justify-between text-sm mb-1.5 font-medium">
                                    <span className="text-gray-700">{stat.name}</span>
                                    <span className="text-gray-900">{stat.amount.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full" 
                                        style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                                <i className="fas fa-chart-pie text-3xl mb-2 opacity-50"></i>
                                <span className="text-sm">No income data</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expense Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-red-500 rounded-full"></div>
                        Spending Breakdown
                    </h3>
                    <div className="space-y-4 flex-1">
                        {expenseBreakdown.length > 0 ? expenseBreakdown.map((stat) => (
                            <div key={stat.name}>
                                <div className="flex justify-between text-sm mb-1.5 font-medium">
                                    <span className="text-gray-700">{stat.name}</span>
                                    <span className="text-gray-900">{stat.amount.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full" 
                                        style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                                <i className="fas fa-chart-pie text-3xl mb-2 opacity-50"></i>
                                <span className="text-sm">No expense data</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Transaction History</h3>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {['all', 'income', 'expense'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-all ${
                                    filterType === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                        {format(t.date.toDate(), 'dd MMM, yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div 
                                                className="w-2 h-8 rounded-full mr-3" 
                                                style={{ backgroundColor: t.categoryColor }}
                                            ></div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{t.categoryName}</div>
                                                <div className="text-xs text-gray-500">{t.description || "No description"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                                        t.type === 'income' ? 'text-green-600' : 'text-gray-900'
                                    }`}>
                                        {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} ₫
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link href={`/admin/expenses/add?id=${t.id}`} className="text-gray-400 hover:text-blue-600 mr-3 transition-colors">
                                            <i className="fas fa-pen"></i>
                                        </Link>
                                        <button onClick={() => handleDelete(t.id, t.description)} className="text-gray-400 hover:text-red-600 transition-colors">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modals */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Delete Transaction"
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous={true}
            />

            <ConfirmModal
                isOpen={publishModal}
                onClose={() => setPublishModal(false)}
                onConfirm={handlePublishConfirm}
                title="Publish Report"
                message="Are you sure you want to publish this month's report? This will be visible to logged-in users."
                confirmText="Publish"
                cancelText="Cancel"
                isDangerous={false}
            />

            <ConfirmModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                confirmText="Close"
                isDangerous={alertModal.type === 'error'}
            />
        </div>
    );
}
