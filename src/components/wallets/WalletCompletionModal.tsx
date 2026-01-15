"use client";

import React, { useState } from 'react';

interface WalletCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (action: 'keep' | 'delete') => void;
    walletTitle: string;
}

export default function WalletCompletionModal({ isOpen, onClose, onConfirm, walletTitle }: WalletCompletionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="p-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 mx-auto text-blue-600">
                        <i className="fas fa-flag-checkered text-3xl"></i>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
                        Complete "{walletTitle}"?
                    </h3>
                    <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
                        Congratulations on finishing this project! How would you like to proceed?
                    </p>

                    <div className="space-y-4">
                        <button 
                            onClick={() => onConfirm('keep')}
                            className="w-full flex items-center p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mr-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-archive"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">Complete & Keep Data</h4>
                                <p className="text-xs text-slate-500">Mark as completed but keep all records for future reference.</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => onConfirm('delete')}
                            className="w-full flex items-center p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mr-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-trash-alt"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">Complete & Delete</h4>
                                <p className="text-xs text-slate-500">Mark as completed and PERMANENTLY delete all data to save space.</p>
                            </div>
                        </button>
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-white/5">
                    <button onClick={onClose} className="text-slate-500 font-bold hover:text-slate-700 text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
