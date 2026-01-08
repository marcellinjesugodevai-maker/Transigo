import { Linking, Platform } from 'react-native';

/**
 * Lit la destination et ouvre l'application de navigation externe (Google Maps / Waze / Apple Maps).
 * @param lat Latitude de la destination
 * @param lng Longitude de la destination
 * @param label Libellé (optionnel, surtout pour Apple Maps)
 */
export const openNavigation = (lat: number, lng: number, label: string = 'Destination') => {
    const latLng = `${lat},${lng}`;

    // Google Maps URL Scheme
    const url = Platform.select({
        ios: `comgooglemaps://?daddr=${latLng}&directionsmode=driving`,
        android: `google.navigation:q=${latLng}`
    });

    if (url) {
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                // Fallback: Apple Maps sur iOS, Google Maps Web sur autres
                if (Platform.OS === 'ios') {
                    Linking.openURL(`maps://?daddr=${latLng}`);
                } else {
                    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latLng}`);
                }
            }
        }).catch(err => console.error('Error opening maps:', err));
    } else {
        // Fallback générique
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latLng}`);
    }
};
