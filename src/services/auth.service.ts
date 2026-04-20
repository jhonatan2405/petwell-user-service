import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt.util';
import {
    CreateUserDto,
    LoginDto,
    AuthResponse,
    UserPublicProfile,
    UserWithRole,
    VerifyEmailDto,
    ForgotPasswordDto,
    ResetPasswordDto,
} from '../models/user.model';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

// Helper: map a DB row to a safe public profile (strips password_hash)
const toPublicProfile = (user: UserWithRole): UserPublicProfile => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.roles.role_name,
    clinic_id: user.clinic_id,
    photo_url: user.photo_url ?? null,
    license_number: user.license_number,
    is_active: user.is_active,
    is_verified: user.is_verified,
    created_at: user.created_at,
    updated_at: user.updated_at,
});

export const authService = {
    /**
     * Registers a new user.
     * - Validates that the email is not already taken.
     * - Hashes the password with bcrypt.
     * - Assigns the default "DUENO_MASCOTA" role if none is provided.
     * - Returns a JWT + public profile.
     */
    async register(dto: CreateUserDto): Promise<AuthResponse> {
        // 1. Duplicate email check
        const existing = await userRepository.findByEmail(dto.email);
        if (existing) {
            const err = new Error('El correo electrónico ya está registrado');
            (err as { statusCode?: number }).statusCode = 409;
            throw err;
        }

        // 2. Resolve role
        let roleId = dto.role_id;
        if (!roleId) {
            roleId = await userRepository.getDefaultRoleId();
        } else {
            const valid = await userRepository.roleExists(roleId);
            if (!valid) {
                const err = new Error('El role_id proporcionado no es válido');
                (err as { statusCode?: number }).statusCode = 400;
                throw err;
            }
        }

        // 3. Hash password
        const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        // 4. Verification fields
        const verification_code = Math.floor(100000 + Math.random() * 900000).toString();
        const verification_expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // 5. Persist
        const newUser = await userRepository.create({
            name: dto.name.trim(),
            email: dto.email.toLowerCase().trim(),
            password_hash,
            phone: dto.phone ?? null,
            role_id: roleId,
            clinic_id: dto.clinic_id ?? null,
            photo_url: null,
            license_number: dto.license_number ?? null,
            is_active: true,
            is_verified: false,
            verification_code,
            verification_expires,
            reset_code: null,
            reset_expires: null,
        });

        // 6. Enviar email (fire-and-forget inmediato)
        console.log("📧 Enviando código de verificación a:", newUser.email);
        await fetch(`${env.notificationServiceUrl}/api/v1/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: newUser.email,
                type: 'SYSTEM',
                title: 'Código de verificación',
                message: `Tu código es: ${verification_code}`,
                channel: 'EMAIL',
            }),
        }).catch((err) => {
            console.error("❌ Error enviando código:", err);
        });

        const profile = toPublicProfile(newUser);

        return { user: profile, message: 'Usuario registrado. Por favor verifica tu correo.' };
    },

    /**
     * Authenticates a user with email + password.
     * Returns a JWT + public profile on success.
     */
    async login(dto: LoginDto): Promise<AuthResponse> {
        // 1. Fetch user
        const user = await userRepository.findByEmail(dto.email);
        if (!user) {
            const err = new Error('Credenciales inválidas');
            (err as { statusCode?: number }).statusCode = 401;
            throw err;
        }

        // 1.5. Verificación required
        if (!user.is_verified) {
            const err = new Error('Cuenta no verificada');
            (err as { statusCode?: number }).statusCode = 403;
            throw err;
        }

        // 2. Compare password
        const passwordMatch = await bcrypt.compare(dto.password, user.password_hash);
        if (!passwordMatch) {
            const err = new Error('Credenciales inválidas');
            (err as { statusCode?: number }).statusCode = 401;
            throw err;
        }

        // 3. Issue token
        const profile = toPublicProfile(user);
        const token = generateToken({
            sub: user.id,
            email: user.email,
            role: profile.role,
            clinic_id: profile.clinic_id,
        });

        return { token, user: profile };
    },

    /**
     * Verifies the user's email with the verification code.
     * Returns a JWT + public profile to auto-login.
     */
    async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse> {
        const userRow = await userRepository.findRawById((await userRepository.findByEmail(dto.email))?.id || '');
        if (!userRow) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }

        if (userRow.is_verified) {
            const err = new Error('La cuenta ya está verificada');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        if (userRow.verification_code !== dto.code) {
            const err = new Error('Código de verificación incorrecto');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        if (userRow.verification_expires && new Date() > new Date(userRow.verification_expires)) {
            const err = new Error('El código de verificación ha expirado');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        await userRepository.updateVerification(userRow.id, {
            is_verified: true,
            verification_code: null,
            verification_expires: null,
        });

        // Generate token for auto-login
        const fullUser = await userRepository.findByEmail(dto.email);
        if (!fullUser) throw new Error('Usuario recargado no encontrado tras verificación');
        const profile = toPublicProfile(fullUser);
        const token = generateToken({
            sub: fullUser.id,
            email: fullUser.email,
            role: profile.role,
            clinic_id: profile.clinic_id,
        });

        return { token, user: profile, message: 'Cuenta verificada exitosamente' };
    },

    /**
     * Resends the verification code for the given email.
     */
    async resendVerificationCode(dto: { email: string }): Promise<void> {
        const userRow = await userRepository.findRawById((await userRepository.findByEmail(dto.email))?.id || '');
        if (!userRow) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }

        if (userRow.is_verified) {
            const err = new Error('La cuenta ya está verificada');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        const verification_code = Math.floor(100000 + Math.random() * 900000).toString();
        const verification_expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await userRepository.updateVerification(userRow.id, {
            is_verified: false,
            verification_code,
            verification_expires,
        });

        // Enviar email (fire-and-forget)
        fetch(`${env.notificationServiceUrl}/api/v1/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userRow.id,
                email: userRow.email,
                type: 'SYSTEM',
                title: 'Nuevo código de verificación',
                message: `Tu nuevo código es: ${verification_code}`,
                channel: 'EMAIL',
            }),
        }).catch((err) => {
            console.error('[ERROR] Fallo al enviar nuevo email de verificación:', err);
        });
    },

    /**
     * Generates a reset code and sends it via email.
     */
    async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
        const userRow = await userRepository.findRawById((await userRepository.findByEmail(dto.email))?.id || '');
        if (!userRow) {
            // No revelamos si el usuario existe o no, pero loggueamos para debug interno
            console.warn(`Forgot password: email ${dto.email} not found`);
            return;
        }

        const reset_code = Math.floor(100000 + Math.random() * 900000).toString();
        const reset_expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await userRepository.updateResetData(userRow.id, {
            reset_code,
            reset_expires,
        });

        // Enviar email (fire-and-forget)
        fetch(`${env.notificationServiceUrl}/api/v1/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userRow.id,
                email: userRow.email,
                type: 'SYSTEM',
                title: 'Recuperación de contraseña',
                message: `Tu código para restablecer contraseña es: ${reset_code}`,
                channel: 'EMAIL',
            }),
        }).catch((err) => {
            console.error('[ERROR] Fallo al enviar email de reset:', err);
        });
    },

    /**
     * Resets password using the received code.
     */
    async resetPassword(dto: ResetPasswordDto): Promise<void> {
        const userRow = await userRepository.findRawById((await userRepository.findByEmail(dto.email))?.id || '');
        if (!userRow) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }

        if (userRow.reset_code !== dto.code) {
            const err = new Error('Código de recuperación incorrecto');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        if (!userRow.reset_expires || new Date() > new Date(userRow.reset_expires)) {
            const err = new Error('El código de recuperación ha expirado');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        const password_hash = await bcrypt.hash(dto.new_password, SALT_ROUNDS);
        
        await userRepository.updatePassword(userRow.id, password_hash);
        
        await userRepository.updateResetData(userRow.id, {
            reset_code: null,
            reset_expires: null,
        });
    },
};
