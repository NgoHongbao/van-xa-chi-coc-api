import cors from 'cors';
import { env } from '../config/env.js';
const devOrigins=new Set(['http://localhost:3000','http://127.0.0.1:3000',env.frontendUrl]);
export const corsMiddleware=cors({origin(origin,callback){if(!origin||devOrigins.has(origin)) return callback(null,true);return callback(new Error(`Origin không được phép: ${origin}`));}});
