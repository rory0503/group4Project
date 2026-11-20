import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import useLocalStorage from "../hooks/useLocalStorage";

const TranslationContext = createContext(null);

const translationCache = new Map();

export const LANGUAGES = [
  ["en", "English"],
  ["zh-CN", "Chinese"],
  ["hi", "Hindi"],
  ["es", "Spanish"],
  ["ar", "Arabic"],
  ["fr", "French"],
  ["bn", "Bengali"],
  ["pt", "Portuguese"],
  ["ru", "Russian"],
  ["id", "Indonesian"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
];

export function TranslationProvider({ children }) {
  const [settings, setSettings] = useLocalStorage(
    "settings",
    { theme: "light", lang: "en" }
  );

  const lang = settings.lang || "en";

  const setLanguage = useCallback((language) => {
    setSettings({
      ...settings,
      lang: language,
    });
  }, [settings, setSettings]);

  const translateTexts = useCallback(async (texts) => {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    if (lang === "en") {
      return texts;
    }

    const results = [...texts];
    const missing = [];
    const missingIndexes = [];

    texts.forEach((text, index) => {
      const original = String(text ?? "");
      const key = `${lang}:${original}`;

      if (!original.trim()) {
        results[index] = original;
      } else if (translationCache.has(key)) {
        results[index] = translationCache.get(key);
      } else {
        missing.push(original);
        missingIndexes.push(index);
      }
    });

    if (missing.length === 0) {
      return results;
    }

    try {
      const response = await fetch(
        "/api/v1/translation/translate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texts: missing,
            target_language: lang,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Translation request failed: ${response.status}`
        );
      }

      const data = await response.json();

      if (
        !Array.isArray(data.translations) ||
        data.translations.length !== missing.length
      ) {
        throw new Error("Invalid translation response");
      }

      data.translations.forEach((translated, index) => {
        const original = missing[index];
        const key = `${lang}:${original}`;

        translationCache.set(key, translated);
        results[missingIndexes[index]] = translated;
      });

      return results;
    } catch (error) {
      console.error("Translation error:", error);
      return texts;
    }
  }, [lang]);

  return (
    <TranslationContext.Provider
      value={{
        lang,
        setLanguage,
        settings,
        setSettings,
        translateTexts,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error(
      "useTranslation must be used inside TranslationProvider"
    );
  }

  return context;
}

/*
 * Translates text used in HTML attributes, including:
 * placeholder, aria-label, title and alt.
 *
 * Example:
 * const placeholder = useTranslatedText("Search models");
 */
export function useTranslatedText(value) {
  const { lang, translateTexts } = useTranslation();

  const originalText = String(value ?? "");

  const [translatedText, setTranslatedText] = useState(originalText);

  useEffect(() => {
    let active = true;

    setTranslatedText(originalText);

    if (lang === "en" || !originalText.trim()) {
      return () => {
        active = false;
      };
    }

    translateTexts([originalText]).then((results) => {
      if (active && results?.[0]) {
        setTranslatedText(results[0]);
      }
    });

    return () => {
      active = false;
    };
  }, [originalText, lang, translateTexts]);

  return translatedText;
}

export function T({ children }) {
  const { lang, translateTexts } = useTranslation();

  const originalText = String(children ?? "");

  const [displayText, setDisplayText] = useState(originalText);

  useEffect(() => {
    let active = true;

    setDisplayText(originalText);

    if (lang === "en" || !originalText.trim()) {
      return () => {
        active = false;
      };
    }

    translateTexts([originalText]).then((results) => {
      if (active && results?.[0]) {
        setDisplayText(results[0]);
      }
    });

    return () => {
      active = false;
    };
  }, [originalText, lang, translateTexts]);

  return <>{displayText}</>;
}
