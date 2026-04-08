import { Request, Response, NextFunction } from 'express';
import { clinicService } from '../services/clinic.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { RegisterClinicDto } from '../models/clinic.model';

export const clinicController = {
    /**
     * GET /clinics
     * Público con JWT – lista básica de clínicas para selects del frontend.
     */
    async getClinics(
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const clinics = await clinicService.getAllClinics();
            sendSuccess(res, { clinics }, 'Clínicas obtenidas correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /clinics/register
     * Público – no requiere JWT.
     */
    async register(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const dto: RegisterClinicDto = req.body;
            const result = await clinicService.registerClinic(dto);
            sendSuccess(res, result, 'Clínica registrada correctamente', 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /clinics/:id
     * Requiere: authenticate + (ADMIN | CLINIC_ADMIN | VETERINARIO | RECEPCIONISTA)
     * VETERINARIO y RECEPCIONISTA solo pueden ver su propia clínica (clinic_id del JWT).
     */
    async getClinic(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { id } = req.params;
            const userRole = req.user?.role;
            const userClinicId = req.user?.clinic_id;

            // VETERINARIO y RECEPCIONISTA solo pueden acceder a su propia clínica
            const restrictedRoles = ['VETERINARIO', 'RECEPCIONISTA'];
            if (restrictedRoles.includes(userRole ?? '')) {
                if (!userClinicId || String(userClinicId) !== String(id)) {
                    sendError(res, 'Acceso denegado – solo puedes ver tu propia clínica', 403);
                    return;
                }
            }

            const clinic = await clinicService.getClinic(id);
            sendSuccess(res, clinic, 'Clínica obtenida correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /clinics/:id/staff
     * Requiere: authenticate + (ADMIN | CLINIC_ADMIN)
     */
    async getClinicStaff(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { id } = req.params;
            const staff = await clinicService.getClinicStaff(id);
            sendSuccess(res, { staff }, 'Personal de clínica obtenido correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /clinics/:id/logo
     * Requires: Bearer token + CLINIC_ADMIN, Multer
     */
    async uploadLogo(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { id } = req.params;
            const file = req.file;

            const userClinicId = req.user?.clinic_id;
            if (!userClinicId || String(userClinicId) !== String(id)) {
                res.status(403).json({ success: false, message: 'No tienes permiso para modificar esta clínica' });
                return;
            }

            if (!file) {
                res.status(400).json({ success: false, message: 'No se envió ningún logo' });
                return;
            }

            const logoUrl = await clinicService.uploadLogo(id, file.buffer, file.mimetype);
            sendSuccess(res, { logo_url: logoUrl }, 'Logo actualizado correctamente');
        } catch (err) {
            next(err);
        }
    },
};

