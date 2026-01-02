"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface MinistrySection {
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    images: string[];
}

interface Appeal {
    id: string;
    title: string;
    titleEn?: string;
    content?: string;
    ministrySections?: MinistrySection[];
    fundraisingImages?: string[];
    fundraisingDescription?: string;
    fundraisingDescriptionEn?: string;
    coverImage?: string;
    createdAt: any;
    status: string;
    type?: string;
    authorName?: string;
    pdfUrl?: string; // Adding this here as well to match previous implementation
}

export default function AppealsPage() {
    const { t, language } = useLanguage();
    const { user, isAdmin } = useAuth(); // Correctly get isAdmin from context
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);

    // const isAdmin = userData?.role === 'admin'; // Removed incorrect line

    const [financialReports, setFinancialReports] = useState<any[]>([]);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    const getContent = (vi: string | undefined, en: string | undefined) => {
        if (language === 'en' && en && en.trim().length > 0) return en;
        return vi || '';
    };

    const getPreviewText = (appeal: Appeal) => {
        if (appeal.content && appeal.content.trim().length > 0) {
            return appeal.content;
        }
        if (appeal.ministrySections && appeal.ministrySections.length > 0) {
            // Use localized description of the first section
            return getContent(appeal.ministrySections[0].description, appeal.ministrySections[0].descriptionEn);
        }
        return '';
    };

    useEffect(() => {
        // Fetch only Published and Official appeals
        const q = query(
            collection(db, "appeals"), 
            where("status", "==", "published"),
            where("type", "==", "official"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Appeal));
            setAppeals(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appeals:", error);
            setLoading(false);
        });

        return () => unsubscribe();
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

    const latestAppeal = appeals.length > 0 ? appeals[0] : null;
    const previousAppeals = appeals.length > 1 ? appeals.slice(1) : [];

    return (
        <main className="min-h-screen bg-gray-50/50 pb-20 font-sans selection:bg-blue-100">
            <Navbar />
            
            <div className="container container-custom pt-32 pb-12">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-2">
                    <div className="max-w-3xl">
                        <span className="text-blue-600 font-bold tracking-wider uppercase text-xs mb-2 block">
                            {t('nav.ministry') || 'Ministry'}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                            {t('appeals.page_title') || 'Appeal Letters'}
                        </h1>
                        <p className="text-xl text-gray-500 font-light leading-relaxed">
                            {t('appeals.page_subtitle') || 'Updates, stories, and urgent calls for support from our ministry.'}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex-shrink-0 mb-2">
                             <Link 
                                href="/admin/appeals/create" 
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white hover:bg-black rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:transform active:scale-95"
                            >
                                <i className="fas fa-plus"></i>
                                <span>New Appeal</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Financial Reports Section (Logged in only) */}
                {user && financialReports.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center gap-4 mb-8">
                             <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-green-600 rounded-full"></span>
                                Financial Reports
                            </h3>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {financialReports.map(report => (
                                <button
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-left flex items-start gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <i className="fas fa-file-invoice-dollar text-xl"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            Financial Report - {new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Income: {report.totalIncome.toLocaleString('vi-VN')} ₫
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Published: {report.publishedAt?.toDate().toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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
                
                {/* Content Area */}
                <div className="space-y-12">
                    {latestAppeal ? (
                        <section className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-4 mb-8">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                    {t('appeals.latest_title') || 'Latest Appeal Letter'}
                                </h3>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>
                            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-8 lg:p-10 border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <i className="fas fa-feather-alt text-9xl text-blue-900 transform rotate-45"></i>
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4 text-sm">
                                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm">
                                            Latest Update
                                        </span>
                                        <span className="text-gray-500 font-medium flex items-center gap-2">
                                            <i className="far fa-calendar-alt"></i>
                                            {formatDate(latestAppeal.createdAt)}
                                        </span>
                                    </div>

                                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                                        <Link href={`/appeals/${latestAppeal.id}`} className="hover:text-blue-600 transition-colors">
                                            {getContent(latestAppeal.title, latestAppeal.titleEn)}
                                        </Link>
                                    </h2>

                                    <div 
                                        className="prose prose-lg text-gray-600 mb-8 max-w-none line-clamp-3 leading-relaxed [&_*]:!text-lg"
                                        dangerouslySetInnerHTML={{ __html: getPreviewText(latestAppeal) }}
                                    />

                                    <div>
                                        <Link 
                                            href={`/appeals/${latestAppeal.id}`} 
                                            className="inline-flex items-center gap-2 text-blue-700 font-bold hover:text-blue-800 transition-colors group/btn"
                                        >
                                            {t('common.read_more') || 'Read Full Letter'}
                                            <i className="fas fa-arrow-right transform group-btn-hover:translate-x-1 transition-transform"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 max-w-4xl mx-auto">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <i className="fas fa-feather-alt text-2xl"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No updates yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto text-sm">We haven't posted any appeal letters recently.</p>
                        </div>
                    )}

                    {/* Previous Appeals - Compact List Layout */}
                    {previousAppeals.length > 0 && (
                        <section className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-4 mb-8">
                                 <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                    {t('appeals.previous') || 'Previous Letters'}
                                </h3>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                {previousAppeals.map(appeal => (
                                    <article key={appeal.id} className="group bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-medium">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                        {formatDate(appeal.createdAt)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{appeal.authorName || 'Admin'}</span>
                                                </div>
                                                
                                                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                    <Link href={`/appeals/${appeal.id}`}>
                                                        {getContent(appeal.title, appeal.titleEn)}
                                                    </Link>
                                                </h4>
                                                
                                                <div 
                                                    className="text-gray-500 text-sm line-clamp-2 leading-relaxed max-w-2xl"
                                                    dangerouslySetInnerHTML={{ __html: getPreviewText(appeal).replace(/<[^>]+>/g, '') }}
                                                />
                                            </div>
                                            
                                            <div className="flex-shrink-0 pt-1">
                                                <Link 
                                                    href={`/appeals/${appeal.id}`}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-[-45deg]"
                                                >
                                                    <i className="fas fa-arrow-right text-sm"></i>
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
