"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface Appeal {
    id: string;
    title: string;
    titleEn?: string;
    pdfUrl?: string;
    pdfUrlEn?: string;
    coverImage?: string;
    createdAt: any;
    status: string;
    type?: string;
    authorName?: string;
    month?: number;
    year?: number;
}

export default function AppealsPage() {
    const { t, language } = useLanguage();
    const { user, isAdmin } = useAuth();
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);

    const [financialReports, setFinancialReports] = useState<any[]>([]);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    const getContent = (vi: string | undefined, en: string | undefined) => {
        if (language === 'en' && en && en.trim().length > 0) return en;
        return vi || '';
    };

    const getPdfUrl = (appeal: Appeal) => {
        if (language === 'en' && appeal.pdfUrlEn) return appeal.pdfUrlEn;
        return appeal.pdfUrl;
    }

    useEffect(() => {
        fetch('/resources/metadata.json')
            .then(res => res.json())
            .then(data => {
                const fetchedAppeals = data.appeals || [];
                // Sort by Year DESC -> Month DESC -> CreatedAt DESC
                fetchedAppeals.sort((a: any, b: any) => {
                    const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);

                    const yearA = a.year || dateA.getFullYear();
                    const yearB = b.year || dateB.getFullYear();
                    
                    if (yearB !== yearA) return yearB - yearA;

                    const monthA = a.month || (dateA.getMonth() + 1);
                    const monthB = b.month || (dateB.getMonth() + 1);
                    
                    if (monthB !== monthA) return monthB - monthA;
                    
                    return dateB.getTime() - dateA.getTime();
                });
                setAppeals(fetchedAppeals);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching appeals:", error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, "financial_reports"),
                where("status", "==", "published")
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort by Year DESC, then Month DESC
                reports.sort((a: any, b: any) => {
                    if (b.year !== a.year) return b.year - a.year;
                    return b.month - a.month;
                });
                setFinancialReports(reports);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        return new Date(timestamp.seconds * 1000).toLocaleDateString(language === 'vi' ? 'vi-VN' : undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            </div>
        );
    }

    // Logic to find the absolute latest item between appeals and reports to highlight
    // However, user asked to highlight the latest financial report AND the latest appeal separately/specifically
    // "1) giữ nguyên hiển thị financial reports nhưng cần lighlight cái mới nhất lên"
    // "2) đổi chung layout giống với financial reports cho appeal letter, cũng có hiển thị bản mới nhất"
    // So distinct lists, but similar layout.

    const latestAppealId = appeals.length > 0 ? appeals[0].id : null;
    const latestReportId = financialReports.length > 0 ? financialReports[0].id : null;

    return (
        <main className="min-h-screen bg-gray-50/50 dark:bg-slate-950 pb-20 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            <Navbar />
            
            <div className="container container-custom pt-32 pb-12">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-2">
                    <div className="max-w-3xl">
                        <span className="text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase text-xs mb-2 block">
                            {t('nav.ministry') || 'Ministry'}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
                            {t('appeals.page_title') || 'Appeal Letters'}
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                            {t('appeals.page_subtitle') || 'Updates, stories, and urgent calls for support from our ministry.'}
                        </p>
                    </div>

                </div>

                {/* Financial Reports Section (Logged in only) */}
                {user && financialReports.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                                Financial Reports
                            </h3>
                            <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {financialReports.map(report => {
                                const isLatest = report.id === latestReportId;
                                return (
                                    <button
                                        key={report.id}
                                        onClick={() => setSelectedReport(report)}
                                        className={`bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border transition-all text-left flex items-start gap-4 group relative overflow-hidden
                                            ${isLatest 
                                                ? 'border-green-500 ring-1 ring-green-500 dark:border-green-400 dark:ring-green-400/50 shadow-green-100 dark:shadow-none' 
                                                : 'border-gray-100 dark:border-white/5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/30'
                                            }`}
                                    >
                                        {isLatest && (
                                            <div className="absolute top-0 right-0">
                                                <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                                    Latest
                                                </div>
                                            </div>
                                        )}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                                            ${isLatest 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white'
                                            }`}>
                                            <i className="fas fa-file-invoice-dollar text-xl"></i>
                                        </div>
                                        <div>
                                            <h4 className={`font-bold transition-colors ${isLatest ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                                                Financial Report - {new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Income: {report.totalIncome.toLocaleString('vi-VN')} ₫
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                Published: {report.publishedAt?.toDate().toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {/* Appeals Section - Grid Layout */}
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                            {t('appeals.latest_title') || 'Appeal Letters'}
                        </h3>
                        <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                    </div>

                    {appeals.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {appeals.map(appeal => {
                                const isLatest = appeal.id === latestAppealId;
                                const pdfUrl = getPdfUrl(appeal);
                                const otherPdfUrl = language === 'en' ? appeal.pdfUrl : appeal.pdfUrlEn;
                                const hasEn = !!appeal.pdfUrlEn;
                                const hasVi = !!appeal.pdfUrl;

                                return (
                                    <div 
                                        key={appeal.id}
                                        className={`bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border transition-all flex flex-col gap-4 group relative overflow-hidden h-full
                                            ${isLatest 
                                                ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400/50 shadow-blue-100 dark:shadow-none' 
                                                : 'border-gray-100 dark:border-white/5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/30'
                                            }`}
                                    >
                                         {isLatest && (
                                            <div className="absolute top-0 right-0">
                                                <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                                    Latest
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                                                ${isLatest 
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                                                }`}>
                                                <i className="fas fa-file-pdf text-xl"></i>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold transition-colors line-clamp-2 mb-1 ${isLatest ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                                                    {getContent(appeal.title, appeal.titleEn)}
                                                </h4>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                                    <span>{formatDate(appeal.createdAt)}</span>
                                                    <span>•</span>
                                                    <span>{appeal.authorName || 'Admin'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex gap-2">
                                            {hasEn && (
                                                 <a 
                                                    href={appeal.pdfUrlEn} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <i className="fas fa-download text-xs"></i> English
                                                </a>
                                            )}
                                            {hasVi && (
                                                 <a 
                                                    href={appeal.pdfUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <i className="fas fa-download text-xs"></i> Tiếng Việt
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                         <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-white/10 max-w-2xl mx-auto">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300 dark:text-gray-600">
                                <i className="fas fa-feather-alt text-xl"></i>
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No updates yet</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">We haven't posted any appeal letters recently.</p>
                        </div>
                    )}
                </div>

                {/* Report Detail Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
                        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                     <i className="fas fa-file-invoice-dollar text-green-500"></i>
                                     Financial Report - {new Date(selectedReport.year, selectedReport.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-900 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                            
                            <div className="p-8">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Total Income</p>
                                        <p className="text-2xl font-extrabold text-gray-900">{selectedReport.totalIncome.toLocaleString('vi-VN')} ₫</p>
                                    </div>
                                    <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Total Expense</p>
                                        <p className="text-2xl font-extrabold text-gray-900">{selectedReport.totalExpense.toLocaleString('vi-VN')} ₫</p>
                                    </div>
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Net Balance</p>
                                        <p className={`text-2xl font-extrabold ${selectedReport.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                            {selectedReport.netBalance.toLocaleString('vi-VN')} ₫
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                                {/* Check if we have the new split data */}
                                                {(selectedReport.realIncomeBreakdown || selectedReport.circulatingIncomeBreakdown) ? (
                                                    <>
                                                        {/* Real Income Section */}
                                                        {selectedReport.realIncomeBreakdown?.length > 0 && (
                                                            <>
                                                                <tr className="bg-green-50/50">
                                                                    <td colSpan={3} className="px-3 py-1.5 text-xs font-bold text-green-600 uppercase tracking-wide">
                                                                        Real Income (Salary/Sponsors)
                                                                    </td>
                                                                </tr>
                                                                {selectedReport.realIncomeBreakdown.map((item: any) => (
                                                                    <tr key={item.name}>
                                                                        <td className="px-3 py-2 font-medium text-gray-700 pl-6">{item.name}</td>
                                                                        <td className="px-3 py-2 text-right text-gray-900">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                                                        <td className="px-3 py-2 text-right text-gray-500">{item.percentage.toFixed(1)}%</td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="font-bold bg-green-50/20 text-xs">
                                                                    <td className="px-3 py-2 text-green-700 pl-6">Subtotal Real</td>
                                                                    <td className="px-3 py-2 text-right text-green-700">
                                                                        {(selectedReport.realIncomeTotal || 0).toLocaleString('vi-VN')} ₫
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right"></td>
                                                                </tr>
                                                            </>
                                                        )}

                                                        {/* Circulating Income Section */}
                                                        {selectedReport.circulatingIncomeBreakdown?.length > 0 && (
                                                            <>
                                                                <tr className="bg-blue-50/50">
                                                                    <td colSpan={3} className="px-3 py-1.5 text-xs font-bold text-blue-600 uppercase tracking-wide mt-2">
                                                                        Circulating Income (Others)
                                                                    </td>
                                                                </tr>
                                                                {selectedReport.circulatingIncomeBreakdown.map((item: any) => (
                                                                    <tr key={item.name}>
                                                                        <td className="px-3 py-2 font-medium text-gray-700 pl-6">{item.name}</td>
                                                                        <td className="px-3 py-2 text-right text-gray-900">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                                                        <td className="px-3 py-2 text-right text-gray-500">{item.percentage.toFixed(1)}%</td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="font-bold bg-blue-50/20 text-xs">
                                                                    <td className="px-3 py-2 text-blue-700 pl-6">Subtotal Circulating</td>
                                                                    <td className="px-3 py-2 text-right text-blue-700">
                                                                        {(selectedReport.circulatingIncomeTotal || 0).toLocaleString('vi-VN')} ₫
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right"></td>
                                                                </tr>
                                                            </>
                                                        )}

                                                        {/* Grand Total */}
                                                        <tr className="font-bold bg-green-100/50 border-t-2 border-green-100">
                                                            <td className="px-3 py-3 text-green-900">Grand Total Income</td>
                                                            <td className="px-3 py-3 text-right text-green-900">{selectedReport.totalIncome.toLocaleString('vi-VN')} ₫</td>
                                                            <td className="px-3 py-3 text-right">100%</td>
                                                        </tr>
                                                    </>
                                                ) : (
                                                    /* Fallback for old reports */
                                                    <>
                                                        {selectedReport.incomeBreakdown.map((item: any) => (
                                                            <tr key={item.name}>
                                                                <td className="px-3 py-2 font-medium text-gray-700">{item.name}</td>
                                                                <td className="px-3 py-2 text-right text-gray-900">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                                                <td className="px-3 py-2 text-right text-gray-500">{item.percentage.toFixed(1)}%</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="font-bold bg-green-50/30">
                                                            <td className="px-3 py-2 text-green-800">Total Income</td>
                                                            <td className="px-3 py-2 text-right text-green-700">{selectedReport.totalIncome.toLocaleString('vi-VN')} ₫</td>
                                                            <td className="px-3 py-2 text-right">100%</td>
                                                        </tr>
                                                    </>
                                                )}
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
                                                {selectedReport.expenseBreakdown.map((item: any) => (
                                                    <tr key={item.name}>
                                                        <td className="px-3 py-2 font-medium text-gray-700">{item.name}</td>
                                                        <td className="px-3 py-2 text-right text-gray-900">{item.amount.toLocaleString('vi-VN')} ₫</td>
                                                        <td className="px-3 py-2 text-right text-gray-500">{item.percentage.toFixed(1)}%</td>
                                                    </tr>
                                                ))}
                                                <tr className="font-bold bg-red-50/30">
                                                    <td className="px-3 py-2 text-red-800">Total Expense</td>
                                                    <td className="px-3 py-2 text-right text-red-700">{selectedReport.totalExpense.toLocaleString('vi-VN')} ₫</td>
                                                    <td className="px-3 py-2 text-right">100%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
