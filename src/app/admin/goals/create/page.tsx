"use client";

import React, { Suspense } from 'react';
import GoalEditor from '@/components/dashboard/GoalEditor';

function CreateGoalContent() {
    return <GoalEditor basePath="/admin/goals" />;
}

export default function CreateGoalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateGoalContent />
        </Suspense>
    );
}
