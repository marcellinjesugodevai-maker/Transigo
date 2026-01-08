// =============================================
// TRANSIGO - TYPES PARTAGÉS
// =============================================

// ============ USER TYPES ============
export interface User {
    id: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: UserRole;
    isVerified: boolean;
    isStudent?: boolean;
    studentCardVerified?: boolean;
    prefersFemaleDriver?: boolean;
    language: Language;
    createdAt: Date;
    updatedAt: Date;
}

export type UserRole = 'passenger' | 'driver' | 'admin';
export type Language = 'fr' | 'dioula' | 'baoule' | 'en';

// ============ DRIVER TYPES ============
export interface Driver extends User {
    role: 'driver';
    vehicleType: VehicleType;
    vehicleBrand: string;
    vehicleModel: string;
    vehiclePlate: string;
    vehicleYear: number;
    vehicleColor: string;
    hasAC: boolean;
    isOnline: boolean;
    isFemale: boolean;
    rating: number;
    totalRides: number;
    level: DriverLevel;
    currentLocation?: Location;
    documents: DriverDocuments;
}

export type VehicleType = 'car' | 'car_ac' | 'moto';
export type DriverLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface DriverDocuments {
    idCard: string;
    driverLicense: string;
    vehicleRegistration: string;
    insurance: string;
    criminalRecord?: string;
}

// ============ RIDE TYPES ============
export interface Ride {
    id: string;
    passengerId: string;
    driverId?: string;
    serviceType: ServiceType;
    status: RideStatus;
    pickup: Location;
    dropoff: Location;
    pickupAddress: string;
    dropoffAddress: string;
    pickupLandmark?: string;
    dropoffLandmark?: string;
    distance: number; // in meters
    duration: number; // in seconds
    estimatedPrice: number;
    finalPrice: number;
    passengerOffer?: number;
    driverCounterOffer?: number;
    isNegotiated: boolean;
    isShared: boolean;
    sharedRideId?: string;
    isEmergency: boolean;
    isVIP: boolean;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    commission: number; // 12%
    driverEarnings: number;
    rating?: number;
    review?: string;
    womenSafetyMode: boolean;
    scheduledAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    createdAt: Date;
}

export type ServiceType = 'car' | 'car_ac' | 'moto' | 'delivery' | 'food';

export type RideStatus =
    | 'pending'        // Waiting for driver
    | 'negotiating'    // Price negotiation in progress
    | 'accepted'       // Driver accepted
    | 'arriving'       // Driver on the way
    | 'arrived'        // Driver at pickup
    | 'in_progress'    // Ride started
    | 'completed'      // Ride finished
    | 'cancelled';     // Cancelled

export type PaymentMethod = 'cash' | 'wallet' | 'orange_money' | 'mtn_momo' | 'wave';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// ============ LOCATION TYPES ============
export interface Location {
    latitude: number;
    longitude: number;
}

export interface AddressWithLandmark {
    address: string;
    landmark?: string;
    location: Location;
}

// ============ DELIVERY TYPES ============
export interface Delivery {
    id: string;
    senderId: string;
    driverId?: string;
    type: DeliveryType;
    status: RideStatus;
    pickup: AddressWithLandmark;
    dropoff: AddressWithLandmark;
    packageSize: PackageSize;
    packageDescription?: string;
    recipientName: string;
    recipientPhone: string;
    price: number;
    photoAtPickup?: string;
    photoAtDelivery?: string;
    createdAt: Date;
}

export type DeliveryType = 'package' | 'food';
export type PackageSize = 'small' | 'medium' | 'large';

// ============ FOOD ORDER TYPES ============
export interface FoodOrder {
    id: string;
    userId: string;
    restaurantId: string;
    items: FoodOrderItem[];
    deliveryAddress: AddressWithLandmark;
    subtotal: number;
    deliveryFee: number;
    total: number;
    status: FoodOrderStatus;
    driverId?: string;
    createdAt: Date;
}

export interface FoodOrderItem {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
}

export type FoodOrderStatus =
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'picked_up'
    | 'delivered'
    | 'cancelled';

// ============ SHARED RIDE TYPES ============
export interface SharedRide {
    id: string;
    route: {
        from: AddressWithLandmark;
        to: AddressWithLandmark;
    };
    scheduledAt: Date;
    maxPassengers: number;
    currentPassengers: SharedRidePassenger[];
    pricePerPerson: number;
    regularPrice: number;
    savingsPercent: number;
    status: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
    driverId?: string;
    createdAt: Date;
}

export interface SharedRidePassenger {
    userId: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    joinedAt: Date;
}

// ============ SUBSCRIPTION TYPES ============
export interface Subscription {
    id: string;
    userId: string;
    plan: SubscriptionPlan;
    ridesIncluded: number;
    ridesUsed: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    autoRenew: boolean;
}

export type SubscriptionPlan = 'basic' | 'pro' | 'unlimited' | 'student';

export interface SubscriptionPlanDetails {
    id: SubscriptionPlan;
    name: string;
    nameFr: string;
    price: number;
    ridesIncluded: number;
    discount: number;
    features: string[];
}

// ============ LOTTERY TYPES ============
export interface LotteryDraw {
    id: string;
    date: Date;
    prizes: LotteryPrize[];
    winners: LotteryWinner[];
    status: 'pending' | 'completed';
}

export interface LotteryPrize {
    position: number;
    amount: number;
}

export interface LotteryWinner {
    userId: string;
    position: number;
    amount: number;
    ticketId: string;
}

export interface LotteryTicket {
    id: string;
    oderId: string;
    drawDate: Date;
    isWinner: boolean;
    prize?: number;
}

// ============ VIP EVENT TYPES ============
export interface VIPEvent {
    id: string;
    userId: string;
    type: VIPEventType;
    date: Date;
    pickupAddress: AddressWithLandmark;
    details: VIPEventDetails;
    vehicles: VIPVehicle[];
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: Date;
}

export type VIPEventType = 'wedding' | 'birthday' | 'corporate' | 'airport_vip';

export interface VIPEventDetails {
    description?: string;
    duration: number; // hours
    needsDecoration?: boolean;
    needsDriverInSuit?: boolean;
}

export interface VIPVehicle {
    type: 'luxury' | 'suv' | 'limousine';
    quantity: number;
    pricePerUnit: number;
}

// ============ WALLET TYPES ============
export interface Wallet {
    id: string;
    oderId: string;
    balance: number;
    currency: 'XOF';
    transactions: WalletTransaction[];
}

export interface WalletTransaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    reference?: string;
    createdAt: Date;
}

// ============ RATING TYPES ============
export interface Rating {
    id: string;
    rideId: string;
    fromUserId: string;
    toUserId: string;
    rating: number; // 1-5
    review?: string;
    createdAt: Date;
}

// ============ NOTIFICATION TYPES ============
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    isRead: boolean;
    createdAt: Date;
}

export type NotificationType =
    | 'ride_request'
    | 'ride_accepted'
    | 'driver_arriving'
    | 'ride_started'
    | 'ride_completed'
    | 'payment'
    | 'promotion'
    | 'lottery'
    | 'system';

// ============ REFERRAL TYPES ============
export interface Referral {
    id: string;
    referrerId: string;
    refereeId: string;
    code: string;
    rewardAmount: number;
    isCompleted: boolean;
    completedAt?: Date;
    createdAt: Date;
}

// ============ EMERGENCY TYPES ============
export interface EmergencyContact {
    id: string;
    userId: string;
    name: string;
    phone: string;
    relationship: string;
}

export interface EmergencyRide extends Ride {
    isEmergency: true;
    hospitalId?: string;
    hospitalName?: string;
}

// ============ API RESPONSE TYPES ============
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
