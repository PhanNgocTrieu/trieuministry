"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, writeBatch, doc } from 'firebase/firestore';

const CATEGORY_COLORS: Record<string, string> = {
    'Sponsors': '#10B981',
    'Salary': '#3B82F6',
    'Routine': '#F59E0B',
    'House Fee': '#6366F1',
    'Installment': '#9CA3AF',
    'Equipments': '#8B5CF6',
    'Sport': '#EC4899',
    'Fellowship': '#F43F5E',
    'Ministry': '#06B6D4',
    'Offerings': '#84CC16',
};

const DEFAULT_EXAMPLE = `1/12/2025	v		200,000 ₫	Sponsor from Ân Tứ	Sponsors
1/12/2025	v		74,651 ₫	Balance from another accounts	Salary
1/12/2025		v	54,000 ₫	Lunch	Routine
...`;

export default function SeedPage() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [inputData, setInputData] = useState('');
    const [status, setStatus] = useState<string>('Ready');
    const [log, setLog] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const handleDeleteMonth = async () => {
        if (!confirm(`WARNING: This will PERMANENTLY DELETE ALL transactions in ${selectedMonth}/${selectedYear}. Are you sure?`)) return;

        setIsLoading(true);
        setStatus("Deleting...");
        addLog(`Deleting data for ${selectedMonth}/${selectedYear}...`);

        try {
            const startDate = new Date(selectedYear, selectedMonth - 1, 1);
            const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
            
            const q = query(
                collection(db, 'expenses'),
                where("date", ">=", Timestamp.fromDate(startDate)),
                where("date", "<=", Timestamp.fromDate(endDate))
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                addLog("No transactions found to delete.");
                setStatus("Idle");
                setIsLoading(false);
                return;
            }

            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            addLog(`Deleted ${snapshot.size} transactions.`);
            setStatus("Success");
        } catch (error: any) {
            console.error(error);
            addLog(`DELETE ERROR: ${error.message}`);
            setStatus("Error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!inputData.trim()) {
            alert("Please paste data to import");
            return;
        }

        setIsLoading(true);
        setStatus("Importing...");
        addLog(`Starting import into ${selectedMonth}/${selectedYear}...`);

        try {
            // 1. Parse Data
            const lines = inputData.trim().split('\n');
            const transactions: any[] = [];
            
            for (const line of lines) {
                const parts = line.split('\t');
                if (parts.length < 6) continue;
                
                // Format: Date | Income(v) | Expense(v) | Amount | Purpose | Category
                const [dateStr, incomeMark, expenseMark, amountStr, purpose, categoryName] = parts;
                
                // Extract DAY from the date string (assume DD/MM/YYYY or just DD)
                const day = parseInt(dateStr.split('/')[0]);
                if (isNaN(day)) continue;

                // Construct date using the TARGET MONTH/YEAR
                const date = new Date(selectedYear, selectedMonth - 1, day);
                
                const amount = parseInt(amountStr.replace(/[^\d]/g, ''));
                const type = incomeMark.trim().toLowerCase() === 'v' ? 'income' : 'expense';

                transactions.push({
                    date,
                    type,
                    amount,
                    description: purpose.trim(),
                    categoryName: categoryName.trim()
                });
            }
            
            addLog(`Parsed ${transactions.length} rows. Using target: ${selectedMonth}/${selectedYear}.`);

            // 2. Get/Create Categories
            // First identify all unique categories from the data
            const uniqueCategories = Array.from(new Set(transactions.map(t => t.categoryName)));
            const categoryMap: Record<string, any> = {};

            // Fetch existing categories
            const catSnap = await getDocs(collection(db, 'expense_categories'));
            catSnap.forEach(doc => {
                const data = doc.data();
                categoryMap[data.name] = { id: doc.id, ...data };
            });

            // Create missing categories
            for (const catName of uniqueCategories) {
                if (!categoryMap[catName]) {
                    addLog(`Creating new category: ${catName}`);
                    const newCat = {
                        name: catName,
                        color: CATEGORY_COLORS[catName] || '#64748B',  // Default color if undefined
                        isDefault: true,
                    };
                    const docRef = await addDoc(collection(db, 'expense_categories'), newCat);
                    categoryMap[catName] = { id: docRef.id, ...newCat };
                }
            }

            // 3. Add Transactions
            const batchSize = 400; // Firestore batch limit is 500
            let batch = writeBatch(db);
            let count = 0;
            let totalAdded = 0;

            for (const t of transactions) {
                const cat = categoryMap[t.categoryName];
                const docRef = doc(collection(db, 'expenses')); // Generate ID
                
                batch.set(docRef, {
                    type: t.type,
                    amount: t.amount,
                    description: t.description,
                    date: Timestamp.fromDate(t.date),
                    categoryId: cat.id,
                    categoryName: cat.name,
                    categoryColor: cat.color
                });

                count++;
                if (count >= batchSize) {
                    await batch.commit();
                    totalAdded += count;
                    addLog(`Committed batch of ${count}...`);
                    batch = writeBatch(db);
                    count = 0;
                }
            }

            if (count > 0) {
                await batch.commit();
                totalAdded += count;
            }

            setStatus("Completed!");
            addLog(`SUCCESS: Imported ${totalAdded} transactions.`);
            setInputData(''); // Clear input on success

        } catch (error: any) {
            console.error(error);
            setStatus("Error");
            addLog(`IMPORT ERROR: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Bulk Transaction Import</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Controls */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 h-fit">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Target Date</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>Month {m}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                            >
                                {Array.from({ length: 10 }, (_, i) => 2023 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Data will be imported into {selectedMonth}/{selectedYear} (Day is taken from input).</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                        <button 
                            onClick={handleDeleteMonth}
                            disabled={isLoading}
                            className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-trash-alt"></i>
                            Delete {selectedMonth}/{selectedYear} Data
                        </button>
                        
                        <button 
                            onClick={handleImport}
                            disabled={isLoading || !inputData.trim()}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-file-import"></i>
                            Import Data
                        </button>
                    </div>

                    <div className="text-center">
                         <span className={`font-bold ${status === 'Error' ? 'text-red-500' : 'text-green-600'}`}>{status}</span>
                    </div>
                </div>

                {/* Log */}
                <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs h-64 overflow-y-auto border border-gray-800 shadow-inner">
                    <div className="text-gray-500 border-b border-gray-800 pb-2 mb-2">Console Log...</div>
                    {log.map((l, i) => <div key={i} className="mb-1">&gt; {l}</div>)}
                    {log.length === 0 && <span className="text-gray-600 italic">Ready...</span>}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Raw Data (Excel/Sheets Paste)</label>
                <textarea
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder={DEFAULT_EXAMPLE}
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
                <p className="text-xs text-gray-400 mt-2">Format: Date | Income(v) | Expense(v) | Amount | Purpose | Category (Tab Separated)</p>
            </div>
        </div>
    );
}
