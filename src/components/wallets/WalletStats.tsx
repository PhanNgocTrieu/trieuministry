"use client";

import React from 'react';

interface WalletStatsProps {
    isOpen: boolean;
    onClose: () => void;
    walletTitle: string;
    items: any[]; // Using any for simplicity in props, but typed in usage
    rate: number;
    type?: 'estimation' | 'management';
}

export default function WalletStats({ isOpen, onClose, walletTitle, items, rate, type = 'management' }: WalletStatsProps) {
    if (!isOpen) return null;

    const isEstimation = type === 'estimation';

    // Estimation Stats
    const totalEstVND = items.reduce((sum, i) => sum + (i.estimatedVND || 0), 0);
    
    // Management (Ledger) Stats
    const totalIncomeVND = items.filter(i => i.type === 'income').reduce((sum, i) => sum + (i.actualVND || 0), 0);
    const totalExpenseVND = items.filter(i => i.type === 'expense' || !i.type).reduce((sum, i) => sum + (i.actualVND || 0), 0);
    const balanceVND = totalIncomeVND - totalExpenseVND;
    const expenseRatio = totalIncomeVND > 0 ? (totalExpenseVND / totalIncomeVND) * 100 : 0;

    // Helper to calculate breakdown
    const calculateBreakdown = (targetType: 'income' | 'expense') => {
        return items.reduce((acc, item) => {
            // Filter by type
            if (isEstimation) {
                if (targetType === 'income') return acc;
            } else {
                 if (targetType === 'income' && item.type !== 'income') return acc;
                 if (targetType === 'expense' && (item.type === 'income')) return acc;
                 if (targetType === 'expense' && !item.type) { /* allow */ }
                 if (targetType === 'income' && !item.type) return acc;
            }

            const key = item.category || "Uncategorized";
            if (!acc[key]) acc[key] = { amount: 0, count: 0, details: {} as Record<string, number> };
            
            const amount = isEstimation ? item.estimatedVND : item.actualVND;
            const val = amount || 0;
            acc[key].amount += val;
            acc[key].count += 1;

            // Collect details for Offering/Dâng hiến items (INCOME only usually, but generic enough)
            const isOffering = key.toLowerCase().includes('offering') || key.toLowerCase().includes('dâng hiến');
            if (isOffering && item.benefactorOf) {
                 const subKey = item.benefactorOf;
                 acc[key].details[subKey] = (acc[key].details[subKey] || 0) + val;
            }

            return acc;
        }, {} as Record<string, { amount: number, count: number, details: Record<string, number> }>);
    };

    const incomeBreakdown = calculateBreakdown('income');
    const expenseBreakdown = calculateBreakdown('expense');

    const sortAndMap = (breakdown: Record<string, { amount: number, count: number, details: Record<string, number> }>, total: number, colorBase: 'green' | 'red' | 'blue') => {
        return (Object.entries(breakdown) as [string, { amount: number, count: number, details: Record<string, number> }][])
            .sort(([, a], [, b]) => b.amount - a.amount)
            .map(([name, stat]) => {
                const percentage = total > 0 ? (stat.amount / total * 100) : 0;
                return { name, ...stat, percentage, colorBase };
            });
    };

    const sortedIncome = sortAndMap(incomeBreakdown, totalIncomeVND, 'green');
    const sortedExpense = sortAndMap(expenseBreakdown, isEstimation ? totalEstVND : totalExpenseVND, isEstimation ? 'blue' : 'red');


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-scale-in flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            <i className="fas fa-chart-pie mr-2 text-blue-500"></i>
                            Stats: {walletTitle}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div className="p-6 space-y-8 flex-1">
                    {/* Big Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {isEstimation ? (
                            // ESTIMATION MODE CARDS
                            <>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-500/20 col-span-2">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">Total Estimated Budget</p>
                                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalEstVND.toLocaleString()} ₫</p>
                                    <p className="text-sm text-slate-500 mt-1">${(totalEstVND / rate).toFixed(2)}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-4xl font-bold text-blue-600">{items.length}</p>
                                        <p className="text-sm text-slate-500 uppercase font-bold">Items</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // MANAGEMENT (LEDGER) MODE CARDS
                            <>
                                <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-500/20">
                                    <p className="text-xs font-bold text-green-500 uppercase tracking-wide mb-1">Total Income</p>
                                    <p className="text-3xl font-extrabold text-green-700 dark:text-green-400">{totalIncomeVND.toLocaleString()} ₫</p>
                                </div>
                                
                                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-500/20">
                                    <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Total Expense</p>
                                    <p className="text-3xl font-extrabold text-red-700 dark:text-red-400">{totalExpenseVND.toLocaleString()} ₫</p>
                                </div>

                                <div className={`p-6 rounded-2xl border shadow-sm ${balanceVND >= 0 ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100' : 'bg-red-50 dark:bg-red-900/10 border-red-100'}`}>
                                    <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${balanceVND >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                        Net Balance
                                    </p>
                                    <p className={`text-3xl font-extrabold ${balanceVND >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {balanceVND.toLocaleString()} ₫
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Progress Bar - Only for Management */}
                    {!isEstimation && (
                        <div>
                             <div className="flex justify-between text-sm font-bold mb-2">
                                 <span>Expenses vs Income</span>
                                 <span>{expenseRatio.toFixed(1)}%</span>
                             </div>
                             <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                                 <div 
                                     className={`h-full rounded-full transition-all duration-500 ${expenseRatio > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                                     style={{ width: `${Math.min(expenseRatio, 100)}%` }}
                                 ></div>
                             </div>
                             <p className="text-xs text-slate-400 mt-1 text-right">Target: Keep expenses below 100% of income</p>
                        </div>
                    )}

                    {/* Breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Breakdown (Hidden for Estimation) */}
                        {!isEstimation && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-6">
                                <h4 className="font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                                    <i className="fas fa-arrow-down"></i> Income Breakdown
                                </h4>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {sortedIncome.length > 0 ? sortedIncome.map((item, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-4">{item.name}</span>
                                                <span className="font-bold text-slate-900 dark:text-white shrink-0">{item.amount.toLocaleString()} ₫</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                <div 
                                                    className="h-full rounded-full bg-green-500"
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-right text-xs text-slate-400 mt-0.5">{item.percentage.toFixed(1)}%</p>
                                            
                                            {/* Detailed Breakdown for Offering */}
                                            {item.details && Object.keys(item.details).length > 0 && (
                                                <div className="mt-2 pl-4 ml-1 border-l-2 border-slate-100 dark:border-white/10">
                                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Via Beneficiaries</p>
                                                    <div className="space-y-1">
                                                        {Object.entries(item.details)
                                                            .sort(([, a], [, b]) => b - a)
                                                            .map(([subName, subAmount], i) => (
                                                                <div key={i} className="flex justify-between text-xs items-center group">
                                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                                         <div className={`w-1.5 h-1.5 rounded-full shrink-0`} style={{ backgroundColor: `hsl(${(subName.length * 40) % 360}, 70%, 50%)` }}></div>
                                                                         <span className="text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{subName}</span>
                                                                    </div>
                                                                    <span className="font-mono text-slate-700 dark:text-slate-300">+{subAmount.toLocaleString()}</span>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )) : <p className="text-slate-500 italic text-sm">No income data available.</p>}
                                </div>
                            </div>
                        )}

                        {/* Expense Breakdown */}
                        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-6 ${isEstimation ? 'col-span-2' : ''}`}>
                            <h4 className={`font-bold mb-4 flex items-center gap-2 ${isEstimation ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                                {isEstimation ? <i className="fas fa-list"></i> : <i className="fas fa-arrow-up"></i>}
                                {isEstimation ? 'Category Breakdown' : 'Expense Breakdown'}
                            </h4>
                            <div className={`grid ${isEstimation ? 'grid-cols-1 md:grid-cols-2 gap-x-8' : 'grid-cols-1'} gap-y-4 max-h-[400px] overflow-y-auto pr-2`}>
                                {sortedExpense.length > 0 ? sortedExpense.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-4">{item.name}</span>
                                            <span className="font-bold text-slate-900 dark:text-white shrink-0">{item.amount.toLocaleString()} ₫</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                            <div 
                                                className={`h-full rounded-full ${item.colorBase === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`}
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-right text-xs text-slate-400 mt-0.5">{item.percentage.toFixed(1)}%</p>
                                    </div>
                                )) : <p className="text-slate-500 italic text-sm">No expense data available.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-lg font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600">
                        Close Report
                    </button>
                    <button onClick={() => window.print()} className="ml-3 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 shadow print:hidden">
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
}
