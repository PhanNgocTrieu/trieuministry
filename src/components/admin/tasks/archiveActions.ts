import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, getDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Task } from './types';
import { format } from 'date-fns';

export const batchArchiveTasks = async (tasksToArchive: Task[], showConfirm: any) => {
    if (tasksToArchive.length === 0) return;

    showConfirm('Archive All Completed', `Are you sure you want to archive ${tasksToArchive.length} completed tasks? They will be moved to monthly reports.`, async () => {
        try {
            const batch = writeBatch(db);
            const tasksByMonth: { [key: string]: Task[] } = {};

            // Group tasks by month
            tasksToArchive.forEach(task => {
                // Use completedAt or createdAt as fallback
                const date = task.completedAt?.toDate() || task.createdAt?.toDate() || new Date();
                const monthKey = format(date, 'yyyy-MM');
                if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = [];
                tasksByMonth[monthKey].push({
                    ...task,
                    archivedAt: new Date(), // Convert to JS Date for array storage (Firestore will convert back if Timestamp used, but arrayUnion works best with plain objects or consistent types)
                    // Note: arrayUnion with Timestamps can be tricky if exact object match needed, 
                    // but here we are just appending. 
                    // Better to store as serialized data or keep Timestamps. 
                    // Let's keep existing structure.
                });
            });

            // For each month, verify doc exists or create it, then update
            // Note: Batch limit is 500. fetching docs doesn't count towards batch write limit but we need to await them.
            
            for (const [month, tasks] of Object.entries(tasksByMonth)) {
                const reportRef = doc(db, 'task_reports', month);
                const reportSnap = await getDoc(reportRef);

                if (!reportSnap.exists()) {
                    batch.set(reportRef, {
                        month: month,
                        tasks: tasks, // Initial array
                        updatedAt: serverTimestamp(),
                        stats: {
                            total: tasks.length,
                            highPriority: tasks.filter(t => t.priority === 'high').length,
                            completedOnTime: 0 // logic to calc
                        }
                    });
                } else {
                    batch.update(reportRef, {
                        tasks: arrayUnion(...tasks),
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // Delete original tasks
            tasksToArchive.forEach(task => {
                const taskRef = doc(db, 'tasks', task.id);
                batch.delete(taskRef);
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error("Batch archive error:", error);
            throw error;
        }
    });
};
