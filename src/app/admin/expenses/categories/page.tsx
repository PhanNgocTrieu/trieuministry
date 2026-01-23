"use client";

import CategoriesManager from "@/components/dashboard/CategoriesManager";
import { Suspense } from "react";

export default function AdminExpenseCategoriesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CategoriesManager basePath="/admin/expenses" scope="ministry" />
        </Suspense>
    );
}
