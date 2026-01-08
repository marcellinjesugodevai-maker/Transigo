import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

// 1. Explicit Import
// @ts-ignore
import carImport from '../assets/car.png';

export default function DiagnosticScreen() {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>DIAGNOSTIC IMAGES</Text>

            {/* TEST 1: REQUIRE */}
            <View style={styles.testBox}>
                <Text style={styles.label}>1. REQUIRE (Relative)</Text>
                <Image
                    source={require('../assets/car.png')}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            {/* TEST 2: IMPORT */}
            <View style={styles.testBox}>
                <Text style={styles.label}>2. IMPORT (Explicit)</Text>
                <Image
                    source={carImport}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            {/* TEST 3: REMOTE URI */}
            <View style={styles.testBox}>
                <Text style={styles.label}>3. REMOTE URI (Internet)</Text>
                <Image
                    source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            {/* TEST 4: EXPO IMAGE */}
            <View style={styles.testBox}>
                <Text style={styles.label}>4. EXPO IMAGE (Require)</Text>
                <ExpoImage
                    source={require('../assets/car.png')}
                    style={styles.image}
                    contentFit="contain"
                    onError={(e) => console.log("EXPO IMAGE ERROR:", e)}
                />
            </View>

            {/* TEST 5: BASE64 (Data) */}
            <View style={styles.testBox}>
                <Text style={styles.label}>5. BASE64 (RED SQUARE)</Text>
                <Image
                    source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAAAEklEQVR42mP8z8AARjwqj3hUHjEAu48D7bALuKAAAAAASUVORK5CYII=' }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.footer}>
                <Text style={{ textAlign: 'center' }}>Si 1, 2 et 4 sont vides = Problème Metro Bundler</Text>
                <Text style={{ textAlign: 'center' }}>Si 3 est vide = Problème Internet/Réseau</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 40,
        color: 'red',
    },
    testBox: {
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        backgroundColor: 'white',
        width: '100%',
    },
    label: {
        marginBottom: 10,
        fontWeight: 'bold',
    },
    image: {
        width: 100,
        height: 100,
        backgroundColor: '#eee', // Grey background to see if container renders
    },
    footer: {
        marginTop: 20,
        padding: 10,
    }
});
