"use client";

import ExpensesManager from "@/components/dashboard/ExpensesManager";
import { Suspense } from "react";

export default function UserExpensesPage() {
    return (
        <Suspense fallback={<div>Loading expenses...</div>}>
            <ExpensesManager basePath="/dashboard/expenses" hideCategories={true} />
        </Suspense>
    );
}
