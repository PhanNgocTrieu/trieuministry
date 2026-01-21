import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type ActivityType = 'prayer' | 'blog' | 'appeal' | 'user' | 'system' | 'task' | 'sponsor' | 'expense' | 'goal' | 'ministry' | 'posts' | 'ministry_update' | 'testimonies' | 'documents' | 'songs';
export type ActivityAction = 'create' | 'update' | 'delete' | 'login' | 'register' | 'publish' | 'other';

export interface ActivityLog {
  type: ActivityType;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, any>;
  timestamp?: any; // serverTimestamp
}

export const logActivity = async (
  type: ActivityType,
  action: ActivityAction,
  description: string,
  metadata: Record<string, any> = {}
) => {
  try {
    await addDoc(collection(db, 'activities'), {
      type,
      action,
      description,
      metadata,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw, we don't want to break the app if logging fails
  }
};
