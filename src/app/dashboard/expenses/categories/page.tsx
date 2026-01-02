"use client";

import CategoriesManager from "@/components/dashboard/CategoriesManager";
import { Suspense } from "react";

export default function UserCategoriesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CategoriesManager basePath="/dashboard/expenses" scope="personal" />
        </Suspense>
    );
}
