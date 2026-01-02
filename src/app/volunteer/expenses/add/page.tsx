"use client";

import ExpenseEditor from "@/components/dashboard/ExpenseEditor";
import { Suspense } from "react";

export default function VolunteerExpenseAddPage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <ExpenseEditor basePath="/volunteer/expenses" />
        </Suspense>
    );
}
