import messages from '../../messages/en.json';
import type { Locale } from '@/config/generated/site';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
