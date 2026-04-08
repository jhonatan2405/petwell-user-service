import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../models/user.model';

/**
 * Generates a signed JWT token for the given payload.
 */
export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
};

/**
 * Verifies and decodes a JWT token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
};
