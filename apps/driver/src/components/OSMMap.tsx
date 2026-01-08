// =============================================
// TRANSIGO DRIVER - OSM MAP COMPONENT
// Carte interactive OpenStreetMap avec Leaflet
// =============================================

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface Marker {
    id: string;
    lat: number;
    lng: number;
    type: 'driver' | 'passenger' | 'pickup' | 'dropoff';
    label?: string;
    heading?: number; // Direction en degrés
}

interface Route {
    coordinates: { lat: number; lng: number }[];
    color?: string;
}

interface OSMMapProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: Marker[];
    route?: Route;
    showCurrentLocation?: boolean;
    onMarkerPress?: (markerId: string) => void;
    onMapPress?: (lat: number, lng: number) => void;
    style?: any;
}

const OSMMap: React.FC<OSMMapProps> = ({
    center = { lat: 5.3499, lng: -4.0166 }, // Abidjan par défaut
    zoom = 14,
    markers = [],
    route,
    showCurrentLocation = true,
    onMarkerPress,
    onMapPress,
    style,
}) => {
    const webViewRef = useRef<WebView>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Générer le HTML de la carte Leaflet
    const generateMapHTML = () => {
        const markersJS = markers.map(marker => {
            const iconConfig = getMarkerIcon(marker.type);
            return `
                var marker_${marker.id} = L.marker([${marker.lat}, ${marker.lng}], {
                    icon: L.divIcon({
                        html: '${iconConfig.html}',
                        className: 'custom-marker',
                        iconSize: [${iconConfig.size}, ${iconConfig.size}],
                        iconAnchor: [${iconConfig.size / 2}, ${iconConfig.size / 2}]
                    })
                }).addTo(map);
                ${marker.label ? `marker_${marker.id}.bindPopup('${marker.label}');` : ''}
                marker_${marker.id}.on('click', function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'markerClick', markerId: '${marker.id}'}));
                });
            `;
        }).join('\n');

        const routeJS = route ? `
            var routeCoords = ${JSON.stringify(route.coordinates.map(c => [c.lat, c.lng]))};
            var polyline = L.polyline(routeCoords, {
                color: '${route.color || '#00C853'}',
                weight: 5,
                opacity: 0.8,
                dashArray: '10, 10'
            }).addTo(map);
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        ` : '';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; }
        .custom-marker {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .driver-marker {
            background: linear-gradient(135deg, #00C853, #00A344);
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,200,83,0.4);
            border: 3px solid white;
            font-size: 20px;
        }
        .passenger-marker {
            background: linear-gradient(135deg, #FF6B00, #E65100);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(255,107,0,0.4);
            border: 3px solid white;
            font-size: 18px;
        }
        .pickup-marker {
            background: linear-gradient(135deg, #4CAF50, #388E3C);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(76,175,80,0.4);
            border: 2px solid white;
            font-size: 16px;
        }
        .dropoff-marker {
            background: linear-gradient(135deg, #F44336, #D32F2F);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(244,67,54,0.4);
            border: 2px solid white;
            font-size: 16px;
        }
        .pulse {
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        .leaflet-control-attribution { display: none !important; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            center: [${center.lat}, ${center.lng}],
            zoom: ${zoom},
            zoomControl: false,
            attributionControl: false
        });

        // Tuiles OSM style clair
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        // Ajout des marqueurs
        ${markersJS}

        // Ajout de la route
        ${routeJS}

        // Clic sur la carte
        map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                lat: e.latlng.lat,
                lng: e.latlng.lng
            }));
        });

        // Fonction pour mettre à jour la position d'un marqueur
        window.updateMarkerPosition = function(markerId, lat, lng, heading) {
            if (window['marker_' + markerId]) {
                window['marker_' + markerId].setLatLng([lat, lng]);
            }
        };

        // Fonction pour centrer la carte
        window.centerMap = function(lat, lng, zoom) {
            map.setView([lat, lng], zoom || map.getZoom());
        };

        // Notifier que la carte est prête
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'mapReady'}));
    </script>
</body>
</html>
        `;
    };

    const getMarkerIcon = (type: string) => {
        switch (type) {
            case 'driver':
                return {
                    html: '<div class="driver-marker pulse">🚗</div>',
                    size: 44,
                };
            case 'passenger':
                return {
                    html: '<div class="passenger-marker">👤</div>',
                    size: 40,
                };
            case 'pickup':
                return {
                    html: '<div class="pickup-marker">📍</div>',
                    size: 36,
                };
            case 'dropoff':
                return {
                    html: '<div class="dropoff-marker">🏁</div>',
                    size: 36,
                };
            default:
                return {
                    html: '<div class="driver-marker">📍</div>',
                    size: 36,
                };
        }
    };

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'mapReady') {
                setIsLoading(false);
            } else if (data.type === 'markerClick' && onMarkerPress) {
                onMarkerPress(data.markerId);
            } else if (data.type === 'mapClick' && onMapPress) {
                onMapPress(data.lat, data.lng);
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    };

    // Mettre à jour un marqueur
    const updateMarker = (markerId: string, lat: number, lng: number, heading?: number) => {
        webViewRef.current?.injectJavaScript(`
            updateMarkerPosition('${markerId}', ${lat}, ${lng}, ${heading || 0});
            true;
        `);
    };

    // Centrer la carte
    const centerOnLocation = (lat: number, lng: number, newZoom?: number) => {
        webViewRef.current?.injectJavaScript(`
            centerMap(${lat}, ${lng}, ${newZoom || zoom});
            true;
        `);
    };

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                source={{ html: generateMapHTML() }}
                style={styles.webview}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
                scrollEnabled={false}
                bounces={false}
            />
            {isLoading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#00C853" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8F5E9',
    },
    webview: {
        flex: 1,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default OSMMap;
