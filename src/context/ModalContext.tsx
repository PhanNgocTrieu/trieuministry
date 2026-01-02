"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '@/components/admin/ConfirmModal';

interface ModalContextType {
    showAlert: (title: string, message: string, onOk?: () => void) => void;
    showConfirm: (
        title: string, 
        message: string, 
        onConfirm: () => void, 
        isDangerous?: boolean,
        confirmText?: string,
        cancelText?: string
    ) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: 'OK',
        cancelText: undefined as string | undefined, // undefined means no cancel button (Alert mode)
        isDangerous: false,
    });

    const showAlert = useCallback((title: string, message: string, onOk?: () => void) => {
        setConfig({
            title,
            message,
            onConfirm: () => {
                if (onOk) onOk();
            },
            confirmText: 'OK',
            cancelText: undefined, // No cancel button for alerts
            isDangerous: false,
        });
        setIsOpen(true);
    }, []);

    const showConfirm = useCallback((
        title: string, 
        message: string, 
        onConfirm: () => void, 
        isDangerous = false,
        confirmText = 'Confirm',
        cancelText = 'Cancel'
    ) => {
        setConfig({
            title,
            message,
            onConfirm,
            confirmText,
            cancelText,
            isDangerous,
        });
        setIsOpen(true);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <ConfirmModal
                isOpen={isOpen}
                onClose={handleClose}
                onConfirm={config.onConfirm}
                title={config.title}
                message={config.message}
                confirmText={config.confirmText}
                cancelText={config.cancelText}
                isDangerous={config.isDangerous}
            />
        </ModalContext.Provider>
    );
}

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
