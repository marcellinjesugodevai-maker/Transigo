// =============================================
// TRANSIGO - I18N (MULTI-LANGUES)
// =============================================

export const translations = {
    fr: {
        // Navigation
        home: 'Accueil',
        activity: 'Activité',
        services: 'Services',
        wallet: 'Portefeuille',
        profile: 'Profil',

        // Common
        confirm: 'Confirmer',
        cancel: 'Annuler',
        save: 'Enregistrer',
        back: 'Retour',
        next: 'Suivant',
        done: 'Terminé',
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',

        // Home
        greeting: 'Bonjour',
        whereToGo: 'Où allez-vous ?',
        popularPlaces: 'Lieux populaires',
        commandButton: 'COMMANDER',

        // Booking
        confirmRide: 'Confirmer la course',
        pickup: 'Départ',
        dropoff: 'Destination',
        selectVehicle: 'Choisir un véhicule',
        womenMode: 'Mode Femme',
        sharedRide: 'Trajet Partagé',
        priceDetails: 'Détails du prix',
        baseFare: 'Prix de base',
        commission: 'Commission TransiGo',
        driverShare: 'Part chauffeur',

        // Profile
        myProfile: 'Mon Profil',
        editProfile: 'Modifier profil',
        savedAddresses: 'Adresses enregistrées',
        paymentMethods: 'Moyens de paiement',
        referral: 'Parrainage',
        subscriptions: 'Mes abonnements',
        studentStatus: 'Statut étudiant',
        security: 'Sécurité',
        language: 'Langue',
        notifications: 'Notifications',
        darkMode: 'Mode sombre',
        help: 'Aide',
        terms: 'Conditions Générales',
        logout: 'Déconnexion',

        // Wallet
        currentBalance: 'Solde actuel',
        recharge: 'Recharger',
        withdraw: 'Retirer',
        transfer: 'Transférer',
        specialOffers: 'Offres Spéciales',
        transactionHistory: 'Historique des transactions',
        today: "AUJOURD'HUI",

        // Student Status
        studentStatusTitle: 'Statut Étudiant',
        studentBenefit: 'Bénéficiez de -30% sur toutes vos courses',
        studentUniversity: 'Université / École',
        studentIdNumber: 'Numéro Étudiant',
        studentCardPhoto: 'Photo de votre carte étudiant',
        studentSubmit: 'Envoyer ma demande',
        studentPending: 'Demande en cours',
        studentVerified: 'Statut Validé !',
        studentRejected: 'Demande Rejetée',

        // Recurring Rides
        recurringRides: 'Trajets réguliers',
        createRecurring: 'Créer un trajet régulier',
        schedule: 'Programmation',
        days: 'Jours',
        time: 'Heure',
        monthlyTotal: 'Total mensuel',
        completedRides: 'Courses effectuées',
        economized: 'Économisés',

        // Group Rides
        groupRide: 'Course Groupée',
        inviteFriends: 'Inviter des amis',
        splitPayment: 'Paiement partagé',
        acceptInvite: 'Accepter l\'invitation',
        declineInvite: 'Refuser',
        yourShare: 'Votre part',
    },
    en: {
        // Navigation
        home: 'Home',
        activity: 'Activity',
        services: 'Services',
        wallet: 'Wallet',
        profile: 'Profile',

        // Common
        confirm: 'Confirm',
        cancel: 'Cancel',
        save: 'Save',
        back: 'Back',
        next: 'Next',
        done: 'Done',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',

        // Home
        greeting: 'Hello',
        whereToGo: 'Where to?',
        popularPlaces: 'Popular places',
        commandButton: 'BOOK NOW',

        airport: 'Airport',
        plateau: 'Plateau',
        confirmRide: 'Confirm ride',
        pickup: 'Pickup',
        dropoff: 'Destination',
        selectVehicle: 'Select vehicle',
        womenMode: 'Women Mode',
        sharedRide: 'Shared Ride',
        priceDetails: 'Price details',
        baseFare: 'Base fare',
        commission: 'TransiGo commission',
        driverShare: 'Driver share',

        // Profile
        myProfile: 'My Profile',
        editProfile: 'Edit profile',
        savedAddresses: 'Saved addresses',
        paymentMethods: 'Payment methods',
        referral: 'Referral',
        subscriptions: 'My subscriptions',
        studentStatus: 'Student status',
        security: 'Security',
        language: 'Language',
        notifications: 'Notifications',
        darkMode: 'Dark mode',
        help: 'Help',
        terms: 'Terms & Conditions',
        logout: 'Logout',

        // Wallet
        currentBalance: 'Current balance',
        recharge: 'Recharge',
        withdraw: 'Withdraw',
        transfer: 'Transfer',
        specialOffers: 'Special Offers',
        transactionHistory: 'Transaction history',
        today: 'TODAY',

        // Activity
        all: 'All',
        ongoing: 'Ongoing',
        completed: 'Completed',
        cancelled: 'Cancelled',
        departure: 'Departure',
        arrival: 'Arrival',
        driver: 'Driver',
        viewDetails: 'View details',

        // Lottery
        lottery: 'Daily Lottery',
        scratchWin: 'Scratch & Win!',
        scratchNow: 'Scratch now',
        myWins: 'My wins this week',
        alreadyPlayed: 'Already played today',
        comeBackTomorrow: 'Come back tomorrow for a new chance!',

        // Student Status
        studentStatusTitle: 'Student Status',
        studentBenefit: 'Get -30% on all your rides',
        studentUniversity: 'University / School',
        studentIdNumber: 'Student ID Number',
        studentCardPhoto: 'Photo of your student card',
        studentSubmit: 'Submit my request',
        studentPending: 'Request pending',
        studentVerified: 'Status Verified!',
        studentRejected: 'Request Rejected',

        // Recurring Rides
        recurringRides: 'Recurring Rides',
        createRecurring: 'Create recurring ride',
        schedule: 'Schedule',
        days: 'Days',
        time: 'Time',
        monthlyTotal: 'Monthly total',
        completedRides: 'Completed rides',
        economized: 'Saved',

        // Group Rides
        groupRide: 'Group Ride',
        inviteFriends: 'Invite friends',
        splitPayment: 'Split payment',
        acceptInvite: 'Accept invitation',
        declineInvite: 'Decline',
        yourShare: 'Your share',
    },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.fr;

export const getTranslation = (key: TranslationKey, lang: Language = 'fr'): string => {
    return translations[lang][key] || translations.fr[key] || key;
};
