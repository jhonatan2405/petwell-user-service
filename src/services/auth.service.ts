import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt.util';
import {
    CreateUserDto,
    LoginDto,
    AuthResponse,
    UserPublicProfile,
    UserWithRole,
} from '../models/user.model';

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

        // 4. Persist
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
        });

        // 5. Issue token
        const profile = toPublicProfile(newUser);
        const token = generateToken({
            sub: newUser.id,
            email: newUser.email,
            role: profile.role,
            clinic_id: profile.clinic_id,
        });

        return { token, user: profile };
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
};
