const zod = require('zod');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file in the server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const envSchema = zod.object({
  PORT: zod.preprocess((val) => Number(val) || 5000, zod.number()),
  NODE_ENV: zod.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: zod.string({
    required_error: 'MONGODB_URI environment variable is required',
  })
    .refine((val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
      message: 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"'
    })
    .refine((val) => !val.includes('<YOUR_MONGODB_CONNECTION_STRING>'), {
      message: 'MONGODB_URI must not contain placeholder values'
    }),
  JWT_SECRET: zod.string({
    required_error: 'JWT_SECRET environment variable is required',
  })
    .refine((val) => !val.includes('<YOUR_RANDOM_JWT_SECRET>') && val !== 'placeholder' && val.length >= 8, {
      message: 'JWT_SECRET must be a secure random string (at least 8 characters) and not contain placeholders'
    }),
  JWT_EXPIRES_IN: zod.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    zod.string().default('24h')
  ),
  CORS_ORIGIN: zod.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    zod.string().default('http://localhost:5173')
  ),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envParse.error.format(), null, 2));
  process.exit(1);
}

module.exports = envParse.data;
