"use client";

import ExpensesManager from "@/components/dashboard/ExpensesManager";
import { Suspense } from "react";

export default function VolunteerExpensesPage() {
    return (
        <Suspense fallback={<div>Loading expenses...</div>}>
            <ExpensesManager basePath="/volunteer/expenses" hideCategories={true} />
        </Suspense>
    );
}
