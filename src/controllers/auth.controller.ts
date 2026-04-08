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
};
