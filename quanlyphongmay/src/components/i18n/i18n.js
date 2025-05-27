// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translation files
import enTranslation from '../locales/en/translation.json';
import viTranslation from '../locales/vi/translation.json';
// import zhTranslation from './locales/zh/translation.json';
// import koTranslation from './locales/ko/translation.json';
// import frTranslation from './locales/fr/translation.json';

i18n
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass i18n instance to react-i18next
    .init({
        resources: {
            en: {
                translation: enTranslation,
            },
            vi: {
                translation: viTranslation,
            },
            // zh: {
            //     translation: zhTranslation,
            // },
            // ko: {
            //     translation: koTranslation,
            // },
            // fr: {
            //     translation: frTranslation,
            // },
        },
        fallbackLng: 'en', // Fallback language
        debug: process.env.NODE_ENV === 'development', // Enable debug logs in development

        interpolation: {
            escapeValue: false, // React already protects from XSS
        },

        // Options for language detector
        detection: {
            order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['cookie', 'localStorage'],
        },
    });

export default i18n;