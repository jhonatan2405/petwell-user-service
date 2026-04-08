import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { staffService } from '../services/staff.service';
import { sendSuccess } from '../utils/response.util';
import { UpdateUserDto, ChangePasswordDto } from '../models/user.model';
import { CreateVeterinarianDto, CreateReceptionistDto, CreateStaffDto } from '../models/clinic.model';

export const userController = {
    /**
     * GET /users
     * Requires: Bearer token + ADMIN role
     */
    async listUsers(
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const users = await userService.listAllUsers();
            sendSuccess(res, users, 'Lista de usuarios obtenida correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /users/profile
     * Requires: Bearer token
     */
    async getProfile(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.user!.sub;
            const profile = await userService.getProfile(userId);
            sendSuccess(res, profile, 'Perfil obtenido correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /users/profile
     * Requires: Bearer token
     * Body: { name?, phone? }
     */
    async updateProfile(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.user!.sub;
            const dto: UpdateUserDto = req.body;
            const profile = await userService.updateProfile(userId, dto);
            sendSuccess(res, profile, 'Perfil actualizado correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/me/photo
     * Requires: Bearer token, Multer
     */
    async uploadPhoto(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.user!.sub;
            const file = req.file;

            if (!file) {
                res.status(400).json({ success: false, message: 'No se envió ninguna foto' });
                return;
            }

            const photoUrl = await userService.uploadPhoto(userId, file.buffer, file.mimetype);
            sendSuccess(res, { photo_url: photoUrl }, 'Foto actualizada correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /users/:id
     * Requires: Bearer token
     * Used by other microservices to get basic user info by ID.
     */
    async getUserById(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { id } = req.params;
            const user = await userService.findUserById(id);
            sendSuccess(res, user, 'Usuario obtenido correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /users/change-password
     * Requires: Bearer token
     * Body: { current_password, new_password }
     */
    async changePassword(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.user!.sub;
            const dto: ChangePasswordDto = req.body;
            await userService.changePassword(userId, dto);
            sendSuccess(res, null, 'Contraseña actualizada correctamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/veterinarians
     * Requires: Bearer token + CLINIC_ADMIN role
     * Body: { name, email, password, license_number }
     */
    async createVeterinarian(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const adminClinicId = req.user!.clinic_id;
            if (!adminClinicId) {
                res.status(400).json({ success: false, message: 'El administrador no tiene una clínica asociada' });
                return;
            }
            const dto: CreateVeterinarianDto = req.body;
            const result = await staffService.createVeterinarian(adminClinicId, dto);
            sendSuccess(res, result, 'Veterinario creado correctamente', 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/staff
     * Requires: Bearer token + CLINIC_ADMIN role
     * Body: { name, email, password, role, license_number? }
     */
    async createStaff(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const adminClinicId = req.user!.clinic_id;
            if (!adminClinicId) {
                res.status(400).json({ success: false, message: 'El administrador no tiene una clínica asociada' });
                return;
            }
            const dto: CreateStaffDto = req.body;
            const result = await staffService.createStaff(adminClinicId, dto);
            sendSuccess(res, result, 'Personal de clínica creado correctamente', 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/receptionists
     * Requires: Bearer token + CLINIC_ADMIN role
     * Body: { name, email, password, phone? }
     */
    async createReceptionist(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const adminClinicId = req.user!.clinic_id;
            if (!adminClinicId) {
                res.status(400).json({ success: false, message: 'El administrador no tiene una clínica asociada' });
                return;
            }
            const dto: CreateReceptionistDto = req.body;
            const result = await staffService.createReceptionist(adminClinicId, dto);
            sendSuccess(res, result, 'Recepcionista creado correctamente', 201);
        } catch (err) {
            next(err);
        }
    },
    /**
     * GET /users/by-email?email=...
     * Requires: Bearer token
     * Used by other microservices to look up a user by email.
     */
    async findUserByEmail(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const email = req.query.email as string;
            if (!email) {
                res.status(400).json({ success: false, message: 'El parámetro email es requerido' });
                return;
            }
            const user = await userService.findUserByEmail(email);
            sendSuccess(res, user, 'Usuario encontrado');
        } catch (err) {
            next(err);
        }
    },
};
