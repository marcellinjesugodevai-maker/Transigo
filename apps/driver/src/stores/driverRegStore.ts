import { create } from 'zustand';

export interface DriverRegistrationData {
    // Profile Type
    profileType: 'driver' | 'delivery' | 'seller';

    // Personal Info
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    city: string;

    // Vehicle Info
    vehicleType: 'standard' | 'moto' | 'van';
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: string;
    vehiclePlate: string;
    vehicleColor: string;

    // Documents (URLs after upload)
    licenseFront: string | null;
    licenseBack: string | null;
    registrationCard: string | null;
    insurance: string | null;
    idCardBoard: string | null;
    // Seller-specific
    businessRegistration: string | null;

    // Delivery-specific
    deliveryTransportMode: 'bike' | 'moto' | 'scooter' | 'walker' | 'van';
    deliveryZone: string;
    availability: 'full_time' | 'part_time' | 'flexible';
}

interface DriverRegState {
    data: DriverRegistrationData;
    updateData: (data: Partial<DriverRegistrationData>) => void;
    reset: () => void;
}

const INITIAL_DATA: DriverRegistrationData = {
    profileType: 'driver',

    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: 'Abidjan',

    vehicleType: 'standard',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    vehicleColor: '',

    licenseFront: null,
    licenseBack: null,
    registrationCard: null,
    insurance: null,
    idCardBoard: null,
    businessRegistration: null,

    deliveryTransportMode: 'moto',
    deliveryZone: '',
    availability: 'full_time',
};

export const useDriverRegStore = create<DriverRegState>((set) => ({
    data: INITIAL_DATA,
    updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
    reset: () => set({ data: INITIAL_DATA }),
}));
