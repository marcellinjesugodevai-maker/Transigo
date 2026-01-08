// =============================================
// TRANSIGO - STUDENT STATUS STORE
// =============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StudentVerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface StudentStatus {
    status: StudentVerificationStatus;
    university: string;
    studentId: string;
    cardImageUri?: string;
    submittedAt?: Date;
    verifiedAt?: Date;
    rejectionReason?: string;
}

interface StudentStatusStore {
    status: StudentStatus;
    submitVerification: (details: Omit<StudentStatus, 'status' | 'submittedAt'>) => void;
    resetStatus: () => void;
    // Mock admin actions
    mockVerify: () => void;
    mockReject: (reason: string) => void;
}

const INITIAL_STATUS: StudentStatus = {
    status: 'none',
    university: '',
    studentId: '',
};

export const useStudentStatusStore = create<StudentStatusStore>()(
    persist(
        (set) => ({
            status: INITIAL_STATUS,

            submitVerification: (details) => {
                set({
                    status: {
                        ...details,
                        status: 'pending',
                        submittedAt: new Date(),
                    },
                });
            },

            resetStatus: () => {
                set({ status: INITIAL_STATUS });
            },

            mockVerify: () => {
                set((state) => ({
                    status: {
                        ...state.status,
                        status: 'verified',
                        verifiedAt: new Date(),
                    },
                }));
            },

            mockReject: (reason) => {
                set((state) => ({
                    status: {
                        ...state.status,
                        status: 'rejected',
                        rejectionReason: reason,
                    },
                }));
            },
        }),
        {
            name: 'transigo-student-status',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
