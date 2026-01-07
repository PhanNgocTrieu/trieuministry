export interface Task {
    id: string;
    content: string; // The main task description
    deadline?: any; // Firestore Timestamp
    priority: 'high' | 'medium' | 'low';
    category: string;
    receiveFrom?: string; // Who gave the task?
    isCompleted: boolean;
    completedAt?: any;
    createdAt: any;
    // Archive metadata
    archivedAt?: any;
    archivedMonth?: string; // YYYY-MM
}

export interface TaskReportDoc {
    month: string; // YYYY-MM
    tasks: Task[];
    updatedAt: any;
    stats?: {
        total: number;
        highPriority: number;
        completedOnTime: number;
    };
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'isCompleted'>;
