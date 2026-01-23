"use client";

import ExpensesManager from "@/components/dashboard/ExpensesManager";
import { Suspense } from "react";

export default function AdminExpensesPage() {
    return (
        <Suspense fallback={<div>Loading expenses...</div>}>
            <ExpensesManager basePath="/admin/expenses" scope="ministry" hideCategories={false} />
        </Suspense>
    );
}
