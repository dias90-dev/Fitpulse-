export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Workout {
  id?: string;
  userId: string;
  title: string;
  date: any;
  duration?: number;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Exercise {
  id?: string;
  userId: string;
  workoutId: string;
  name: string;
  sets: Array<{
    reps: number;
    weight: number;
  }>;
  createdAt: any;
}

export interface HealthProfile {
  userId: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  injuries: string;
  goals: string;
  equipment: string;
  trainingReminder?: boolean;
  reminderTime?: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserSettings {
  userId: string;
  unitSystem: 'metric' | 'imperial';
  notificationsEnabled: boolean;
  updatedAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
