"use client";

import CategoriesManager from "@/components/dashboard/CategoriesManager";
import { Suspense } from "react";

export default function AdminMinistryCategoriesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CategoriesManager basePath="/admin/my-expenses" scope="ministry" />
        </Suspense>
    );
}
