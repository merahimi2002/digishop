import 'server-only';
import { validateEnvironment } from '@/config/env-schema';

export const serverEnv = validateEnvironment(process.env);
