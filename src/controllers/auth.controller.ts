import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response.util';
import { CreateUserDto, LoginDto } from '../models/user.model';

export const authController = {
    /**
     * POST /users/register
     * Body: { name, email, password, phone?, role_id? }
     */
    async register(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const dto: CreateUserDto = req.body;
            const result = await authService.register(dto);
            sendSuccess(res, result, 'Usuario registrado correctamente', 201);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/login
     * Body: { email, password }
     */
    async login(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const dto: LoginDto = req.body;
            const result = await authService.login(dto);
            sendSuccess(res, result, 'Inicio de sesión exitoso');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/verify
     * Body: { email, code }
     */
    async verifyEmail(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const result = await authService.verifyEmail(req.body);
            sendSuccess(res, result, 'Cuenta verificada exitosamente');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/resend-code
     * Body: { email }
     */
    async resendVerificationCode(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            await authService.resendVerificationCode(req.body);
            sendSuccess(res, null, 'Si el correo existe y no está verificado, se enviará un nuevo código');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/forgot-password
     * Body: { email }
     */
    async forgotPassword(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            await authService.forgotPassword(req.body);
            sendSuccess(res, null, 'Si el correo existe, se enviará un código de recuperación');
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /users/reset-password
     * Body: { email, code, new_password }
     */
    async resetPassword(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            await authService.resetPassword(req.body);
            sendSuccess(res, null, 'Contraseña actualizada correctamente');
        } catch (err) {
            next(err);
        }
    },
};
