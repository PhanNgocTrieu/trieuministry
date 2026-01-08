"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, Timestamp, setDoc } from 'firebase/firestore'; 
import ConfirmModal from '@/components/admin/ConfirmModal';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface Transaction {
    id: string;
    userId: string;
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    date: Timestamp;
    description: string;
    createdAt?: Timestamp;
}

interface ExpensesManagerProps {
    basePath: string;
    hideCategories?: boolean;
    scope?: 'personal' | 'ministry' | 'all';
    targetUserId?: string;
}

export default function ExpensesManager({ basePath, hideCategories = false, scope = 'personal', targetUserId }: ExpensesManagerProps) {
    const { user, isAdmin } = useAuth();
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

    // Modals state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
    const [publishModal, setPublishModal] = useState(false);
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ 
        isOpen: false, title: '', message: '', type: 'info' 
    });

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
        router.replace(`${basePath}?date=${newMonth}`, { scroll: false });
    };

    useEffect(() => {
        if (!selectedMonth || !user) return;
        
        const [year, month] = selectedMonth.split('-').map(Number);
        if (!year || !month) return;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        // Fetch ALL expenses for the month period, then filter clientside to handle mixed legacy data
        // Ideally we index 'date' and maybe 'scope' later
        const q = query(
            collection(db, "expenses"),
            where("date", ">=", startTimestamp),
            where("date", "<=", endTimestamp),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Transaction[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // Filter Logic
                const isPersonal = data.scope === 'personal';
                const isMinistry = data.scope === 'ministry' || !data.scope; // Treat legacy as ministry

                // If managing Personal, must match User ID AND be Personal scope
                if (scope === 'personal') {
                    const target = targetUserId || user.uid;
                    if (data.userId !== target) return;
                    if (!isPersonal) return; 
                }

                // If managing Ministry, show Ministry scope.
                if (scope === 'ministry') {
                    if (!isMinistry) return;
                }
                
                // If scope is 'all', show everything (Admin view)
                if (scope === 'all') {
                    // No filtering needed
                }

                list.push({
                    id: doc.id, 
                    ...data,
                    type: data.type || 'expense' 
                } as Transaction);
            });
            
            // Client-side sort: Date DESC, then CreatedAt DESC
            list.sort((a, b) => {
                const dateA = a.date.toMillis();
                const dateB = b.date.toMillis();
                if (dateA !== dateB) {
                    return dateB - dateA;
                }
                // Same date, check created time
                const createdA = a.createdAt?.toMillis() || 0;
                const createdB = b.createdAt?.toMillis() || 0;
                return createdB - createdA;
            });

            setTransactions(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedMonth, user, scope]);

    const handleDelete = async (id: string, description: string) => {
        setDeleteModal({ isOpen: true, id, name: description });
    };

    const confirmDelete = async () => {
        if (deleteModal.id) {
            await deleteDoc(doc(db, "expenses", deleteModal.id));
            setDeleteModal({ isOpen: false, id: '', name: '' });
        }
    };

    // Stats Calculations
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Helper to get breakdown
    const getBreakdown = (type: 'income' | 'expense') => {
        const subset = transactions.filter(t => t.type === type);
        const total = type === 'income' ? totalIncome : totalExpense;
        
        const stats = subset.reduce((acc, item) => {
            if (!acc[item.categoryName]) {
                acc[item.categoryName] = { amount: 0, color: item.categoryColor || '#ccc', count: 0 };
            }
            acc[item.categoryName].amount += item.amount;
            acc[item.categoryName].count += 1;
            return acc;
        }, {} as Record<string, { amount: number, color: string, count: number }>);

        return Object.entries(stats)
            .sort(([, a], [, b]) => b.amount - a.amount)
            .map(([name, stat]) => ({ name, ...stat, percentage: total > 0 ? (stat.amount / total * 100) : 0 }));
    };

    const incomeBreakdown = getBreakdown('income');
    const expenseBreakdown = getBreakdown('expense');

    // Split Income Analysis
    const realIncomeCategories = ['salary', 'sponsors']; // Lowercase for comparison
    const realIncomeBreakdown = incomeBreakdown.filter(item => realIncomeCategories.includes(item.name.toLowerCase().trim()));
    const circulatingIncomeBreakdown = incomeBreakdown.filter(item => !realIncomeCategories.includes(item.name.toLowerCase().trim()));

    const realIncomeTotal = realIncomeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    const circulatingIncomeTotal = circulatingIncomeBreakdown.reduce((sum, item) => sum + item.amount, 0);

    const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);

    const handlePublishClick = () => {
        setPublishModal(true);
    };

    const handlePublishConfirm = async () => {
        setPublishing(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const reportId = `report_${year}_${month}_${user?.uid}`; // Unique per user
            
            const reportData = {
                userId: user?.uid, // Bind to user
                year: parseInt(year),
                month: parseInt(month),
                totalIncome,
                totalExpense,
                netBalance,
                incomeBreakdown,
                realIncomeBreakdown,
                circulatingIncomeBreakdown,
                realIncomeTotal,
                circulatingIncomeTotal,
                expenseBreakdown,
                publishedAt: Timestamp.now(),
                status: 'published'
            };

            await setDoc(doc(db, "financial_reports", reportId), reportData);
            setAlertModal({
                isOpen: true,
                title: 'Success',
                message: 'Financial report published successfully!',
                type: 'success'
            });
        } catch (error) {
            console.error("Error publishing report:", error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to publish report. Please try again.',
                type: 'error'
            });
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track income, expenses, and monthly balance.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={handlePublishClick}
                            disabled={publishing}
                            className="bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-500 shadow-sm font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {publishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
                            <span>Publish Report</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowReport(!showReport)}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                            showReport 
                            ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        <i className={`fas ${showReport ? 'fa-times' : 'fa-file-export'}`}></i>
                        <span>{showReport ? 'Close' : 'Export Stats'}</span>
                    </button>

                    <Link 
                        href={`${basePath}/categories`}
                        className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm font-bold text-sm transition-all"
                    >
                        <i className="fas fa-tags mr-2 text-slate-400"></i> Categories
                    </Link>
                    <Link 
                        href={`${basePath}/add`}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20 font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <i className="fas fa-plus"></i> New Transaction
                    </Link>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 max-w-fit">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-500">Month:</label>
                    <select
                        value={parseInt(selectedMonth.split('-')[1])}
                        onChange={(e) => {
                            const newMonthStr = e.target.value.padStart(2, '0');
                            const year = selectedMonth.split('-')[0];
                            handleMonthChange(`${year}-${newMonthStr}`);
                        }}
                        className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 font-bold py-2 pl-3 pr-8 outline-none border"
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
                    <label className="text-sm font-bold text-slate-500">Year:</label>
                    <select
                        value={parseInt(selectedMonth.split('-')[0])}
                        onChange={(e) => {
                            const newYear = e.target.value;
                            const month = selectedMonth.split('-')[1];
                            handleMonthChange(`${newYear}-${month}`);
                        }}
                        className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 font-bold py-2 pl-3 pr-8 outline-none border"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-green-500/20 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-arrow-up text-6xl text-green-500"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 group-hover:text-green-500 transition-colors">Total Income</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {totalIncome.toLocaleString('vi-VN')} ₫
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-red-500/20 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-arrow-down text-6xl text-red-500"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 group-hover:text-red-500 transition-colors">Total Expense</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {totalExpense.toLocaleString('vi-VN')} ₫
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-blue-500/20 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-wallet text-6xl text-blue-500"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 group-hover:text-blue-500 transition-colors">Net Balance</p>
                    <p className={`text-3xl font-extrabold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                        {netBalance.toLocaleString('vi-VN')} ₫
                    </p>
                </div>
            </div>

            {/* Detailed Report Section */}
            {showReport && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/5 overflow-hidden animate-fade-in-down">
                    <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                            <i className="fas fa-file-invoice-dollar text-blue-500 mr-2"></i>
                            Monthly Financial Report - {new Date(selectedMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => window.print()} className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 print:hidden" title="Print Report">
                            <i className="fas fa-print text-lg"></i>
                        </button>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Table */}
                        <div>
                            <h3 className="font-bold text-green-600 dark:text-green-400 mb-4 border-b border-slate-200 dark:border-white/10 pb-2">Income Analysis</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="px-3 py-2 text-left rounded-l-md">Category</th>
                                        <th className="px-3 py-2 text-right">Amount</th>
                                        <th className="px-3 py-2 text-right rounded-r-md">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* Real Income Section */}
                                    {realIncomeBreakdown.length > 0 && (
                                        <>
                                            <tr className="bg-green-500/5">
                                                <td colSpan={3} className="px-3 py-1.5 text-xs font-bold text-green-400 uppercase tracking-wide">
                                                    Real Income (Salary & Sponsors)
                                                </td>
                                            </tr>
                                            {realIncomeBreakdown.map(item => (
                                                <tr key={item.name}>
                                                    <td className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 pl-6">{item.name}</td>
                                                    <td className="px-3 py-2 text-right text-slate-900 dark:text-white">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                                    <td className="px-3 py-2 text-right text-slate-500">{item.percentage.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold bg-green-500/10 text-xs">
                                                <td className="px-3 py-2 text-green-400 pl-6">Subtotal Real Income</td>
                                                <td className="px-3 py-2 text-right text-green-400">{realIncomeTotal.toLocaleString('vi-VN')} ₫</td>
                                                <td className="px-3 py-2 text-right"></td>
                                            </tr>
                                        </>
                                    )}

                                    {/* Circulating Income Section */}
                                    {circulatingIncomeBreakdown.length > 0 && (
                                        <>
                                            <tr className="bg-blue-500/5">
                                                <td colSpan={3} className="px-3 py-1.5 text-xs font-bold text-blue-400 uppercase tracking-wide mt-2">
                                                    Circulating Income (Balance & Others)
                                                </td>
                                            </tr>
                                            {circulatingIncomeBreakdown.map(item => (
                                                <tr key={item.name}>
                                                    <td className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 pl-6">{item.name}</td>
                                                    <td className="px-3 py-2 text-right text-slate-900 dark:text-white">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                                    <td className="px-3 py-2 text-right text-slate-500">{item.percentage.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold bg-blue-500/10 text-xs">
                                                <td className="px-3 py-2 text-blue-400 pl-6">Subtotal Circulating</td>
                                                <td className="px-3 py-2 text-right text-blue-400">{circulatingIncomeTotal.toLocaleString('vi-VN')} ₫</td>
                                                <td className="px-3 py-2 text-right"></td>
                                            </tr>
                                        </>
                                    )}

                                    {/* Grand Total */}
                                    <tr className="font-bold bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-white/10">
                                        <td className="px-3 py-3 text-slate-900 dark:text-white">Grand Total Income</td>
                                        <td className="px-3 py-3 text-right text-green-600 dark:text-green-400">{totalIncome.toLocaleString('vi-VN')} ₫</td>
                                        <td className="px-3 py-3 text-right text-slate-400">100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Expense Table */}
                        <div>
                            <h3 className="font-bold text-red-600 dark:text-red-400 mb-4 border-b border-slate-200 dark:border-white/10 pb-2">Expense Analysis</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="px-3 py-2 text-left rounded-l-md">Category</th>
                                        <th className="px-3 py-2 text-right">Amount</th>
                                        <th className="px-3 py-2 text-right rounded-r-md">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {expenseBreakdown.map(item => (
                                        <tr key={item.name}>
                                            <td className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300">{item.name}</td>
                                            <td className="px-3 py-2 text-right text-slate-900 dark:text-white">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                            <td className="px-3 py-2 text-right text-slate-500">{item.percentage.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-white/10">
                                        <td className="px-3 py-2 text-slate-900 dark:text-white">Total Expense</td>
                                        <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">{totalExpense.toLocaleString('vi-VN')} ₫</td>
                                        <td className="px-3 py-2 text-right text-slate-400">100%</td>
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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-white/5 flex flex-col h-full hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                        Income Sources
                    </h3>
                    <div className="space-y-4 flex-1">
                        {incomeBreakdown.length > 0 ? incomeBreakdown.map((stat) => (
                            <div key={stat.name}>
                                <div className="flex justify-between text-sm mb-1.5 font-medium">
                                    <span className="text-slate-600 dark:text-slate-300">{stat.name}</span>
                                    <span className="text-slate-900 dark:text-white">{stat.amount.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full" 
                                        style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                                <i className="fas fa-chart-pie text-3xl mb-2 opacity-50"></i>
                                <span className="text-sm">No income data</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expense Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-white/5 flex flex-col h-full hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-red-500 rounded-full"></div>
                        Spending Breakdown
                    </h3>
                    <div className="space-y-4 flex-1">
                        {expenseBreakdown.length > 0 ? expenseBreakdown.map((stat) => (
                            <div key={stat.name}>
                                <div className="flex justify-between text-sm mb-1.5 font-medium">
                                    <span className="text-slate-600 dark:text-slate-300">{stat.name}</span>
                                    <span className="text-slate-900 dark:text-white">{stat.amount.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full" 
                                        style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                                <i className="fas fa-chart-pie text-3xl mb-2 opacity-50"></i>
                                <span className="text-sm">No expense data</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Transaction History</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-white/5">
                        {['all', 'income', 'expense'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-all ${
                                    filterType === t ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        {format(t.date.toDate(), 'dd MMM, yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div 
                                                className="w-2 h-8 rounded-full mr-3" 
                                                style={{ backgroundColor: t.categoryColor }}
                                            ></div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{t.categoryName}</div>
                                                <div className="text-xs text-slate-500">{t.description || "No description"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                                        t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'
                                    }`}>
                                        {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} ₫
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link href={`${basePath}/add?id=${t.id}`} className="text-slate-500 hover:text-blue-400 mr-3 transition-colors">
                                            <i className="fas fa-pen"></i>
                                        </Link>
                                        <button onClick={() => handleDelete(t.id, t.description)} className="text-slate-500 hover:text-red-400 transition-colors">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
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
