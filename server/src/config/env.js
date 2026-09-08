import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const defaultAdminUsers = JSON.stringify([
  {
    name: 'Ishaan',
    username: 'ishaan',
    email: 'ishaan@neurocogno.local',
    password: '555879',
    role: 'developer'
  },
  {
    name: 'CEO',
    username: 'ceo',
    email: 'ceo@neurocogno.local',
    password: '555879',
    role: 'ceo'
  },
  {
    name: 'COO',
    username: 'coo',
    email: 'coo@neurocogno.local',
    password: '555879',
    role: 'coo'
  }
]);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  CLIENT_ORIGIN: z
    .string()
    .default('http://127.0.0.1:5173')
    .refine(
      (value) => value.split(',').map((part) => part.trim()).filter(Boolean).every((part) => {
        try {
          // eslint-disable-next-line no-new
          new URL(part);
          return true;
        } catch {
          return false;
        }
      }),
      { message: 'CLIENT_ORIGIN must be a URL, or a comma-separated list of URLs' }
    ),
  PUBLIC_BASE_URL: z.string().url().default('http://127.0.0.1:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/neurocogno'),
  MONGODB_DB_NAME: z.string().default('neurocogno'),
  JWT_ACCESS_SECRET: z.string().min(24).default('dev-access-secret-change-before-production'),
  JWT_REFRESH_SECRET: z.string().min(24).default('dev-refresh-secret-change-before-production'),
  COOKIE_SECRET: z.string().min(16).default('dev-cookie-secret'),
  ADMIN_USERS_JSON: z.string().default(defaultAdminUsers),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  BOOKING_AMOUNT_INR: z.coerce.number().int().positive().default(499),
  CEO_PHONE: z.string().default('+918976543210'),
  BUSINESS_EMAIL: z.string().email().default('hello@neurocogno.com'),
  INFO_EMAIL: z.string().email().default('info@neurocogno.com'),
  SUPPORT_EMAIL: z.string().email().default('support@neurocogno.com'),
  BUSINESS_ADDRESS: z.string().default('Bangalore, India'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default('')
});

function assertProductionSecrets(config) {
  if (config.NODE_ENV !== 'production') return;

  const forbiddenSecretFragments = ['dev-', 'change-before-production'];
  const weakAdminPasswords = new Set(['555879', 'password', 'admin', 'admin123', '12345678']);
  const admins = (() => {
    try {
      return JSON.parse(config.ADMIN_USERS_JSON);
    } catch {
      return [];
    }
  })();

  const weakSecrets = [
    ['JWT_ACCESS_SECRET', config.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', config.JWT_REFRESH_SECRET],
    ['COOKIE_SECRET', config.COOKIE_SECRET]
  ].filter(([, value]) => forbiddenSecretFragments.some((fragment) => String(value).includes(fragment)));

  if (weakSecrets.length) {
    throw new Error(`Production startup blocked: replace default secrets for ${weakSecrets.map(([key]) => key).join(', ')}`);
  }

  const unsafeAdmins = Array.isArray(admins)
    ? admins.filter((admin) => {
        const password = String(admin.password || '');
        const email = String(admin.email || '');
        return weakAdminPasswords.has(password) || email.endsWith('.local') || password.length < 12;
      })
    : [];

  if (!Array.isArray(admins) || admins.length < 3 || unsafeAdmins.length) {
    throw new Error('Production startup blocked: ADMIN_USERS_JSON must contain final CEO, COO, and developer accounts with real emails and strong passwords.');
  }
}
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

assertProductionSecrets(parsed.data);

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';

export function adminSeedUsers() {
  try {
    const users = JSON.parse(env.ADMIN_USERS_JSON);
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}



// Supports a single origin (existing behavior) or a comma-separated list
// (e.g. "https://neurocogno.com,https://www.neurocogno.com") for deployments
// that serve the same app from more than one hostname. Falls back to
// CLIENT_ORIGIN alone when no comma is present, so default single-origin
// setups are unaffected.
export function allowedClientOrigins() {
  return String(env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function cloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}
