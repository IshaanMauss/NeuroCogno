import crypto from 'crypto';
import { env } from '../config/env.js';

export function hashIp(req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  return crypto.createHmac('sha256', env.COOKIE_SECRET).update(String(ip)).digest('hex');
}

export function requestClientMeta(req) {
  return {
    ipHash: hashIp(req),
    userAgent: req.get('user-agent') || ''
  };
}
