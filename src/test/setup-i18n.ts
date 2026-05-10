import 'fake-indexeddb/auto';
import { loadTranslations, setLocale } from '$lib/services/i18n';

setLocale('en');
await loadTranslations('en', '/');
