import { useAuthStore } from '@/app/store/auth-store';
import { en } from './locales/en';
import { km } from './locales/km';
import { ko } from './locales/ko';
import { Language, TranslationSchema } from './types';

const dictionaries: Record<Language, TranslationSchema> = {
  en,
  km,
  ko,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationSchema>;

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), obj);
}

export function useTranslation() {
  const user = useAuthStore((state) => state.user);
  const updateUserLanguage = useAuthStore((state) => state.updateUserLanguage);

  // Active language resolution: database profile > localStorage > fallback 'en'
  const currentLang = (user?.language || localStorage.getItem('app_language') || 'en') as Language;
  const activeLang: Language = dictionaries[currentLang] ? currentLang : 'en';

  const dictionary = dictionaries[activeLang];
  const fallbackDictionary = dictionaries.en;

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = getNestedValue(dictionary, key);

    // Fallback to English if key missing in chosen language
    if (!text) {
      text = getNestedValue(fallbackDictionary, key);
    }

    if (!text) {
      return key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text!.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
      });
    }

    return text;
  };

  const changeLanguage = async (newLang: Language) => {
    await updateUserLanguage(newLang);
  };

  return {
    t,
    language: activeLang,
    changeLanguage,
  };
}
