"use client";

import GoalEditor from "@/components/dashboard/GoalEditor";
import { Suspense } from "react";

export default function VolunteerGoalCreatePage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <GoalEditor basePath="/volunteer/goals" />
        </Suspense>
    );
}
