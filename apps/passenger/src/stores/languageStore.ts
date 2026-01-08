// =============================================
// TRANSIGO - LANGUAGE STORE (ZUSTAND)
// =============================================

import { create } from 'zustand';
import { Language, getTranslation, TranslationKey } from '@/i18n/translations';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>()((set, get) => ({
    language: 'fr',
    setLanguage: (lang: Language) => set({ language: lang }),
    t: (key: TranslationKey) => getTranslation(key, get().language),
}));

// TODO: Redémarrer Metro pour activer la persistence AsyncStorage
// Une fois Metro redémarré, décommenter le code persist ci-dessous
/*
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            currentLanguage: 'fr',
            setLanguage: (lang: Language) => set({ currentLanguage: lang }),
            t: (key: TranslationKey) => getTranslation(key, get().currentLanguage),
        }),
        {
            name: 'transigo-language',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
*/
