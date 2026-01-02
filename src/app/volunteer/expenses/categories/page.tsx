"use client";

import CategoriesManager from "@/components/dashboard/CategoriesManager";
import { Suspense } from "react";

export default function VolunteerCategoriesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CategoriesManager basePath="/volunteer/expenses" scope="personal" />
        </Suspense>
    );
}
