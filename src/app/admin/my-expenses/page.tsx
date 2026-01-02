"use client";

import ExpensesManager from "@/components/dashboard/ExpensesManager";
import { Suspense } from "react";

export default function AdminPersonalExpensesPage() {
    return (
        <Suspense fallback={<div>Loading expenses...</div>}>
            <ExpensesManager basePath="/admin/my-expenses" scope="ministry" hideCategories={false} />
        </Suspense>
    );
}
