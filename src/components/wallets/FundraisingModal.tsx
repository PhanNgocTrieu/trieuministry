"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useModal } from '@/context/ModalContext';

interface FundraisingModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: string;
    totalEstimate: number;
    availableFunds: number; // Derived from items
    initialTargetPeople?: number;
    onUpdate: (targetPeople: number) => void;
}

export default function FundraisingModal({ 
    isOpen, 
    onClose, 
    walletId, 
    totalEstimate, 
    availableFunds = 0, 
    initialTargetPeople = 1,
    onUpdate 
}: FundraisingModalProps) {
    const { showAlert } = useModal();
    const [targetPeople, setTargetPeople] = useState(initialTargetPeople);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTargetPeople(initialTargetPeople > 0 ? initialTargetPeople : 1);
        }
    }, [isOpen, initialTargetPeople]);

    if (!isOpen) return null;

    const remaining = Math.max(0, totalEstimate - availableFunds);
    const perPerson = targetPeople > 0 ? remaining / targetPeople : 0;

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, "wallets", walletId);
            await updateDoc(docRef, {
                targetPeople
            });
            onUpdate(targetPeople);
            showAlert('Success', 'Fundraising details updated.');
            onClose();
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to update fundraising details.');
        } finally {
            setSaving(false);
        }
    };

    const formatVND = (num: number = 0) => (num || 0).toLocaleString() + ' ₫';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-purple-600">
                    <h3 className="text-xl font-bold text-white">
                        <i className="fas fa-hand-holding-heart mr-2"></i>
                        Call for Support
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Inputs */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target People (Quantity)</label>
                        <input 
                            type="number"
                            min="0"
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-lg font-bold text-purple-600 outline-none focus:ring-2 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={targetPeople === 0 ? '' : targetPeople}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setTargetPeople(isNaN(val) ? 0 : val);
                            }}
                        />
                    </div>

                    {/* Calculation Display */}
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Total Estimate Cost:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{formatVND(totalEstimate)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Less Available Funds (Added):</span>
                            <span className="font-bold text-green-600">- {formatVND(availableFunds)}</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-white/10 my-2"></div>
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Remaining Need:</span>
                            <span className="font-extrabold text-red-600">{formatVND(remaining)}</span>
                        </div>
                    </div>

                     {/* Result Highlight */}
                    <div className="bg-purple-600 text-white p-6 rounded-2xl text-center shadow-lg shadow-purple-500/20">
                        <p className="text-sm font-medium opacity-90 uppercase tracking-widest mb-1">Target Per Person</p>
                        <p className="text-4xl font-extrabold">{formatVND(Math.ceil(perPerson))}</p>
                        <p className="text-xs opacity-70 mt-2">
                           {remaining > 0 
                                ? `To cover ${formatVND(remaining)} with ${targetPeople} people.` 
                                : 'Fully covered! No fundraising needed.'}
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-lg font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-500 shadow disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                        Save & Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
