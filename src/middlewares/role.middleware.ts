import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';
import { UserRole } from '../models/user.model';

/**
 * Middleware factory that restricts access to users with specific roles.
 * Must be used AFTER the authenticate middleware.
 *
 * @example
 * router.get('/admin-only', authenticate, authorize(UserRole.ADMIN), handler)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(res, 'No autorizado – no autenticado', 401);
            return;
        }

        const userRole = req.user.role as UserRole;

        if (!allowedRoles.includes(userRole)) {
            sendError(
                res,
                `Acceso denegado – rol requerido: ${allowedRoles.join(' o ')}`,
                403,
            );
            return;
        }

        next();
    };
};

// ── Named role-guard shortcuts ────────────────────────────────────────────────

/** Restricts access to ADMIN users only. */
export const adminOnly = authorize(UserRole.ADMIN);

/** Restricts access to VETERINARIO users only. */
export const veterinarianOnly = authorize(UserRole.VETERINARIO);

/** Restricts access to CLINICA users only. */
export const clinicOnly = authorize(UserRole.CLINICA);

/** Restricts access to CLINIC_ADMIN users only. */
export const clinicAdminOnly = authorize(UserRole.CLINIC_ADMIN);

/** Restricts access to DUENO_MASCOTA users only. */
export const petOwnerOnly = authorize(UserRole.DUENO_MASCOTA);

/** Restricts access to ADMIN or VETERINARIO users. */
export const adminOrVeterinarian = authorize(UserRole.ADMIN, UserRole.VETERINARIO);
