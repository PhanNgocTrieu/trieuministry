"use client";

import GoalEditor from "@/components/dashboard/GoalEditor";
import { Suspense } from "react";

export default function UserGoalCreatePage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <GoalEditor basePath="/dashboard/goals" />
        </Suspense>
    );
}
