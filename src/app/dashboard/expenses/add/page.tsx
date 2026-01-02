"use client";

import ExpenseEditor from "@/components/dashboard/ExpenseEditor";
import { Suspense } from "react";

export default function UserExpenseAddPage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <ExpenseEditor basePath="/dashboard/expenses" />
        </Suspense>
    );
}
