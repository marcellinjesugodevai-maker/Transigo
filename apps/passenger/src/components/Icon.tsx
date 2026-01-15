import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

// Mapping des noms d'icônes Ionicons vers Unicode/Émojis
const ICON_MAP: Record<string, string> = {
    // Navigation
    'arrow-back': '←',
    'arrow-forward': '→',
    'arrow-up': '↑',
    'arrow-down': '↓',
    'chevron-back': '‹',
    'chevron-forward': '›',
    'chevron-up': '︿',
    'chevron-down': '﹀',
    'close': '×',

    // Transport
    'car': '🚗',
    'car-sport': '🏎',
    'bicycle': '🚲',
    'bus': '🚌',
    'airplane': '✈️',
    'package': '📦',
    'restaurant': '🍴',
    'fast-food': '🍔',
    'van': '🚐',
    'motorcycle': '🏍️',
    'business': '🏢',
    'city': '🏙️',

    // Location & Map
    'location': '📍',
    'location-outline': '📌',
    'navigate': '🧭',
    'map': '🗺',

    // Communication
    'call': '📞',
    'mail': '✉️',
    'chatbubble': '💬',
    'notifications': '🔔',
    'notifications-outline': '🔔',
    'mic': '🎤',

    // Actions
    'search': '🔍',
    'add': '+',
    'remove': '−',
    'checkmark': '✓',
    'close-circle': '⊗',
    'heart': '♥',
    'heart-outline': '♡',
    'star': '⭐',
    'star-outline': '☆',
    'bookmark': '🔖',
    'pencil': '✏️',
    'trash': '🗑️',
    'copy': '📋',
    'copy-outline': '📋',
    'share-social': '📤',
    'trophy': '🏆',
    'stats-chart': '📊',
    'trending-up': '📈',
    'hand-right': '👋',
    'rocket': '🚀',
    'flashlight': '🔦',

    // People & User
    'person': '👤',
    'person-outline': '👤',
    'people': '👥',
    'person-add': '👤⁺',
    'male': '♂',
    'female': '♀',
    'woman': '👩',
    'woman-outline': '👩',
    'man': '👨',

    // Interface
    'home': '🏠',
    'home-outline': '⌂',
    'settings': '⚙',
    'menu': '☰',
    'ellipsis-horizontal': '⋯',
    'ellipsis-vertical': '⋮',
    'grid': '🧩',
    'list': '☰',
    'game-controller': '🎮',
    'analytics': '📈',

    // Financial
    'wallet': '💰',
    'wallet-outline': '💳',
    'card': '💳',
    'cash': '💵',
    'gift': '🎁',
    'ticket': '🎫',

    // Time & Calendar
    'time': '⏰',
    'calendar': '📅',
    'hourglass': '⏳',

    // Objects
    'document': '📄',
    'document-text': '📄',
    'image': '🖼',
    'camera': '📷',
    'shield': '🛡',
    'shield-checkmark': '🛡✓',
    'lock-closed': '🔒',
    'lock-open': '🔓',
    'key': '🔑',
    'keypad': '🔢',
    'finger-print': '☝️',

    // Status
    'information-circle': 'ℹ',
    'help-circle': '?',
    'warning': '⚠',
    'alert-circle': '⚠',
    'checkmark-circle': '✓',

    // Misc
    'flash': '⚡',
    'snow': '❄',
    'sunny': '☀',
    'moon': '🌙',
    'share': '⤴',
    'download': '⬇',
    'log-out-outline': '🚪',
    'radio': '🔘',
    'cloud': '☁',
    'wifi': '📶',
    'battery-full': '🔋',
    'volume-high': '🔊',
    'language': '🌐',
    'school': '🎓',
    'help-circle-outline': '❓',
};

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
}

export default function Icon({ name, size = 24, color = '#000', style }: IconProps) {
    const iconChar = ICON_MAP[name] || '•';

    return (
        <Text
            style={[
                {
                    fontSize: size,
                    color: color,
                    lineHeight: size * 1.2,
                },
                style,
            ]}
        >
            {iconChar}
        </Text>
    );
}

// Export pour compatibilité
export { Icon };
