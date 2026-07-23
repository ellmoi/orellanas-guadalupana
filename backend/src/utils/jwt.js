import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, version: user.tokenVersion, type: 'access' }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const signRefreshToken = (user, sessionId) =>
  jwt.sign({ sub: user.id, sid: sessionId, version: user.tokenVersion, type: 'refresh' }, env.jwtSecret, {
    expiresIn: `${env.refreshExpiresInDays}d`,
  });

export const verifyJwt = (token) => jwt.verify(token, env.jwtSecret);
