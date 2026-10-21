import { config } from 'dotenv';

config({ quiet: true });
if (process.env.DATABASE_URL_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

process.env.REFERENCE_DATE = '2026-10-15';
process.env.ATTENTION_NO_CONTACT_DAYS = '5';
process.env.ATTENTION_EVENT_WINDOW_DAYS = '7';
