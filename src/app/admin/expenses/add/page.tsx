"use client";

import ExpenseEditor from "@/components/dashboard/ExpenseEditor";
import { Suspense } from "react";

export default function AdminExpenseAddPage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <ExpenseEditor basePath="/admin/expenses" defaultScope="ministry" />
        </Suspense>
    );
}
