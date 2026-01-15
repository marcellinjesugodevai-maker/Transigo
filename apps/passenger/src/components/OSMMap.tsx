import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { DEFAULT_LOCATION } from '@/constants';

interface OSMMapProps {
    initialRegion: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    markers?: Array<{
        id: string;
        latitude: number;
        longitude: number;
        icon?: string;
        title?: string;
        vehicle_type?: string; // Ajout du type de véhicule
    }>;
    routeCoordinates?: Array<{
        latitude: number;
        longitude: number;
    }>;
    sharedRoutes?: Array<{
        id: string;
        coordinates: Array<{ latitude: number; longitude: number }>;
        color?: string;
    }>;
    onRoutePress?: (id: string) => void;
    centerTo?: { latitude: number; longitude: number };
    zoom?: number;
    style?: any;
    onMapClick?: (lat: number, lon: number) => void;
}

export default function OSMMap({
    initialRegion,
    markers = [],
    routeCoordinates = [],
    sharedRoutes = [],
    onRoutePress,
    centerTo,
    zoom = 14,
    style,
    onMapClick
}: OSMMapProps) {
    const webViewRef = useRef<WebView>(null);
    const isLoadedRef = useRef(false);
    const lastRouteKeyRef = useRef('');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // IMPORTANT: Stocker les coordonnées INITIALES dans un ref pour qu'elles ne changent JAMAIS
    // C'est la clé pour éviter le rechargement de la WebView!
    const initialCoordsRef = useRef({
        lat: initialRegion?.latitude || DEFAULT_LOCATION.latitude,
        lon: initialRegion?.longitude || DEFAULT_LOCATION.longitude,
        zoom: zoom
    });

    // Créer une clé unique pour la route (pour éviter de la renvoyer si identique)
    const getRouteKey = useCallback((coords: typeof routeCoordinates) => {
        if (!coords || coords.length < 2) return '';
        const first = coords[0];
        const last = coords[coords.length - 1];
        return `${first.latitude.toFixed(5)},${first.longitude.toFixed(5)}-${last.latitude.toFixed(5)},${last.longitude.toFixed(5)}-${coords.length}`;
    }, []);

    // HTML de la carte - MEMOIZED pour ne jamais être régénéré
    const mapHtml = React.useMemo(() => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        #map { width: 100%; height: 100%; background: #e5e3df; }
        .leaflet-control-attribution { display: none !important; }
        
        /* Point bleu Google Maps */
        .user-marker {
            width: 22px; height: 22px;
            background: #4285F4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .user-marker-pulse {
            position: absolute;
            width: 40px; height: 40px;
            top: -9px; left: -9px;
            background: rgba(66, 133, 244, 0.25);
            border-radius: 50%;
            animation: pulse 2s ease-out infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        
        /* Marqueur de départ (pickup) */
        .pickup-marker {
            width: 20px; height: 20px;
            background: #00C853;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        /* Marqueur de destination */
        .dest-marker {
            width: 14px; height: 14px;
            background: #FF5722;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        /* Marqueur taxi - voiture vue de dessus avec flèche directionnelle */
        .taxi-marker {
            width: 40px;
            height: 40px;
            transition: transform 0.8s ease-out;
        }
        
        .taxi-car {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        /* Couleurs par catégorie */
        .taxi-standard { background: linear-gradient(135deg, #607D8B 0%, #455A64 100%); }
        .taxi-comfort { background: linear-gradient(135deg, #37474F 0%, #263238 100%); }
        .taxi-luxury { background: linear-gradient(135deg, #212121 0%, #000000 100%); border: 3px solid #FFD700; } /* Bordure Or pour Luxe */
        .taxi-family { background: linear-gradient(135deg, #1A237E 0%, #0D47A1 100%); }
        .taxi-moto { background: linear-gradient(135deg, #FF6F00 0%, #E65100 100%); width: 32px; height: 32px; } /* Plus petit pour moto */

        /* Fallback */
        .taxi-default { background: linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%); }
        
        .taxi-car::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 12px solid white;
        }
        
        .taxi-inner {
            font-size: 18px;
            color: white;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([${initialCoordsRef.current.lat}, ${initialCoordsRef.current.lon}], ${initialCoordsRef.current.zoom});

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(map);

        // Stockage des marqueurs par ID
        var markersById = {};
        var markerPositions = {};  // Pour calculer la direction
        var markerBearings = {};   // Orientation actuelle de chaque marqueur

        setTimeout(function() { map.invalidateSize(); }, 200);

        // Calculer le bearing (cap) entre deux points
        function calculateBearing(lat1, lon1, lat2, lon2) {
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var lat1Rad = lat1 * Math.PI / 180;
            var lat2Rad = lat2 * Math.PI / 180;
            
            var y = Math.sin(dLon) * Math.cos(lat2Rad);
            var x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
                    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
            
            var bearing = Math.atan2(y, x) * 180 / Math.PI;
            return (bearing + 360) % 360;  // Normaliser à 0-360
        }

        function createMarkerIcon(id, hasRoute, bearing, vehicleType) {
            var markerHtml = '';
            var size = [24, 24];
            
            if (id === 'user' || (id === 'pickup' && !hasRoute)) {
                markerHtml = '<div class="user-marker-pulse"></div><div class="user-marker"></div>';
                size = [40, 40];
            }
            else if (id === 'pickup') {
                markerHtml = '<div class="pickup-marker"></div>';
                size = [20, 20];
            }
            else if (id === 'destination' || id === 'dropoff') {
                markerHtml = '<div class="dest-marker"></div>';
                size = [20, 20];
            }
            else {
                // Taxi/Driver avec rotation
                var rotationAngle = bearing || 0;
                var typeClass = 'taxi-default';
                var emoji = '🚗';

                // Mapper le type vers la classe CSS
                if (vehicleType === 'standard') typeClass = 'taxi-standard';
                else if (vehicleType === 'comfort') typeClass = 'taxi-comfort';
                else if (vehicleType === 'luxury') typeClass = 'taxi-luxury';
                else if (vehicleType === 'family') { typeClass = 'taxi-family'; emoji = '🚐'; }
                else if (vehicleType === 'moto') { typeClass = 'taxi-moto'; emoji = '🏍️'; size = [32, 32]; }

                markerHtml = '<div class="taxi-marker" style="transform: rotate(' + rotationAngle + 'deg);"><div class="taxi-car ' + typeClass + '"><span class="taxi-inner">' + emoji + '</span></div></div>';
                if (vehicleType !== 'moto') size = [44, 44];
            }
            
            return L.divIcon({
                html: markerHtml,
                className: '',
                iconSize: size,
                iconAnchor: [size[0]/2, size[1]/2]
            });
        }

        function updateMap(data) {
            if (!data) return;
            var hasRoute = data.routeCoordinates && data.routeCoordinates.length > 1;
            
            var receivedIds = {};
            if (data.markers && data.markers.length > 0) {
                data.markers.forEach(function(m) {
                    if (m.latitude == null || m.longitude == null) return;
                    
                    var id = String(m.id || '').toLowerCase();
                    receivedIds[id] = true;
                    var latLng = L.latLng(m.latitude, m.longitude);
                    
                    var bearing = markerBearings[id] || 0;
                    var isTaxi = (id === 'driver' || id.indexOf('driver') !== -1 || id === 'taxi' || id.indexOf('taxi') !== -1 || !isNaN(id));
                    
                    if (isTaxi && markerPositions[id]) {
                        var prevPos = markerPositions[id];
                        var dist = Math.abs(m.latitude - prevPos.lat) + Math.abs(m.longitude - prevPos.lon);
                        if (dist > 0.00001) {
                            bearing = calculateBearing(prevPos.lat, prevPos.lon, m.latitude, m.longitude);
                            markerBearings[id] = bearing;
                        }
                    }
                    
                    markerPositions[id] = { lat: m.latitude, lon: m.longitude };
                    
                    if (markersById[id]) {
                        markersById[id].setLatLng(latLng);
                        if (isTaxi) {
                            var newIcon = createMarkerIcon(id, hasRoute, bearing, m.vehicle_type);
                            markersById[id].setIcon(newIcon);
                        }
                    } else {
                        var icon = createMarkerIcon(id, hasRoute, bearing, m.vehicle_type);
                        markersById[id] = L.marker(latLng, { icon: icon }).addTo(map);
                    }
                });
            }
            
            // Supprimer marqueurs obsolètes
            Object.keys(markersById).forEach(function(id) {
                if (!receivedIds[id]) {
                    map.removeLayer(markersById[id]);
                    delete markersById[id];
                }
            });

            // 2. ROUTE - Dessiner si nouvelle route reçue
            if (hasRoute) {
                // Créer une clé pour cette route
                var first = data.routeCoordinates[0];
                var last = data.routeCoordinates[data.routeCoordinates.length - 1];
                var newRouteKey = first.latitude.toFixed(4) + ',' + first.longitude.toFixed(4) + 
                                  '-' + last.latitude.toFixed(4) + ',' + last.longitude.toFixed(4);
                
                // Dessiner seulement si c'est une nouvelle route
                if (newRouteKey !== lastRouteKey) {
                    lastRouteKey = newRouteKey;
                    
                    // Supprimer l'ancienne route
                    if (routeLine) {
                        map.removeLayer(routeLine);
                        routeLine = null;
                    }
                    
                    var coords = [];
                    for (var i = 0; i < data.routeCoordinates.length; i++) {
                        var c = data.routeCoordinates[i];
                        if (c && c.latitude != null && c.longitude != null) {
                            coords.push([c.latitude, c.longitude]);
                        }
                    }
                    
                    if (coords.length > 1) {
                        routeLine = L.polyline(coords, {
                            color: '#FF6B00',
                            weight: 6,
                            opacity: 0.9,
                            lineCap: 'round',
                            lineJoin: 'round'
                        }).addTo(map);
                        
                        map.fitBounds(routeLine.getBounds(), { 
                            padding: [50, 50],
                            animate: true,
                            duration: 0.8
                        });
                    }
                }
            } else {
                lastRouteKey = '';
            }

            // 3. ITINÉRAIRES PARTAGÉS (CONTEXTE)
            if (data.sharedRoutes && data.sharedRoutes.length > 0) {
                var receivedSharedIds = {};
                data.sharedRoutes.forEach(function(sr) {
                    receivedSharedIds[sr.id] = true;
                    if (sharedRouteLines[sr.id]) {
                        // Déjà dessiné - on pourrait mettre à jour mais souvent statique
                    } else {
                        var coords = sr.coordinates.map(function(c) { return [c.latitude, c.longitude]; });
                        sharedRouteLines[sr.id] = L.polyline(coords, {
                            color: sr.color || '#2E7D32', // Vert par défaut pour covoiturage
                            weight: 5,
                            opacity: 0.6,
                            lineCap: 'round',
                            dashArray: '10, 10' // Pointillé pour distinguer du trajet principal
                        }).addTo(map);
                        
                        // Détection de clic sur la ligne
                        sharedRouteLines[sr.id].on('click', function(e) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ 
                                type: 'route_press', 
                                id: sr.id 
                            }));
                        });
                    }
                });
                
                // Nettoyage des routes disparues
                Object.keys(sharedRouteLines).forEach(function(id) {
                    if (!receivedSharedIds[id]) {
                        map.removeLayer(sharedRouteLines[id]);
                        delete sharedRouteLines[id];
                    }
                });
            } else {
                // Nettoyer tout si aucun
                Object.keys(sharedRouteLines).forEach(function(id) {
                    map.removeLayer(sharedRouteLines[id]);
                    delete sharedRouteLines[id];
                });
            }

            // 4. CENTRAGE MANUEL
            if (data.centerTo && data.centerTo.latitude != null && !hasRoute) {
                map.flyTo([data.centerTo.latitude, data.centerTo.longitude], data.zoom || 14, { duration: 1 });
            }
        }

        // 5. GESTION DU CLIC SUR LA CARTE
        map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'map_click', 
                lat: e.latlng.lat,
                lon: e.latlng.lng 
            }));
        });

        // Réception des messages
        document.addEventListener('message', function(e) {
            try { updateMap(JSON.parse(e.data)); } catch(err) {}
        });
        window.addEventListener('message', function(e) {
            try { updateMap(JSON.parse(e.data)); } catch(err) {}
        });
    </script>
</body>
</html>`, []);  // Tableau vide = ne jamais recréer

    // Envoi des données avec debounce
    const sendData = useCallback(() => {
        if (!webViewRef.current || !isLoadedRef.current) return;

        // Toujours envoyer les données - le JavaScript gère la comparaison de clé
        const payload = JSON.stringify({
            markers,
            routeCoordinates,
            sharedRoutes,
            centerTo,
            zoom
        });

        webViewRef.current.postMessage(payload);
    }, [markers, routeCoordinates, sharedRoutes, centerTo, zoom]);

    // Debounce les mises à jour pour éviter les envois trop fréquents
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            sendData();
        }, 150); // 150ms de debounce

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [markers, routeCoordinates, sharedRoutes, centerTo, zoom]);

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: mapHtml }}
                style={styles.map}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                allowFileAccess={true}
                onLoadEnd={() => {
                    isLoadedRef.current = true;
                    setTimeout(() => {
                        lastRouteKeyRef.current = '';
                        sendData();
                    }, 400);
                }}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'route_press' && onRoutePress) {
                            onRoutePress(data.id);
                        }
                        if (data.type === 'map_click' && onMapClick) {
                            onMapClick(data.lat, data.lon);
                        }
                    } catch (e) { }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        backgroundColor: '#e5e3df',
    }
});
