// Generated from doc/BUSINESS_CONFIG.md. Do not edit.
export const siteConfig = {
  "brand": {
    "key": "digishop",
    "names": {
      "fa": "دیجی شاپ",
      "en": "Digishop"
    },
    "descriptions": {
      "fa": null,
      "en": null
    },
    "domain": null
  },
  "localization": {
    "defaultLocale": "fa",
    "locales": [
      {
        "code": "fa",
        "direction": "rtl",
        "label": "فارسی"
      },
      {
        "code": "en",
        "direction": "ltr",
        "label": "English"
      }
    ],
    "displayCurrency": "IRT",
    "storageCurrency": "IRR",
    "englishPricesAreTranslatedOnly": true
  },
  "appearance": {
    "defaultTheme": "system",
    "availableThemes": [
      "light",
      "dark"
    ],
    "style": "modern-minimal-glass",
    "primaryColor": "#0F766E",
    "logoColors": {
      "light": {
        "base": "#0B1F3A",
        "accent": "#0F766E"
      },
      "dark": {
        "base": "#EDF2F7",
        "accent": "#2DD4BF"
      }
    },
    "persianFont": null,
    "latinFont": null
  },
  "timezone": "Asia/Tehran"
} as const;
export type Locale = (typeof siteConfig.localization.locales)[number]['code'];
