"use client";

import ExpenseEditor from "@/components/dashboard/ExpenseEditor";
import { Suspense } from "react";

export default function AdminPersonalExpenseAddPage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <ExpenseEditor basePath="/admin/my-expenses" defaultScope="ministry" />
        </Suspense>
    );
}
