import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository';
import { UpdateUserDto, ChangePasswordDto, UserPublicProfile, UserWithRole } from '../models/user.model';

const SALT_ROUNDS = 12;

const toPublicProfile = (user: UserWithRole): UserPublicProfile => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.roles.role_name,
    clinic_id: user.clinic_id,
    photo_url: user.photo_url ?? null,
    clinic_logo_url: user.clinics?.logo_url ?? null,
    license_number: user.license_number,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
});

export const userService = {
    /**
     * Returns a public-safe list of all users (strips password_hash).
     */
    async listAllUsers(): Promise<UserPublicProfile[]> {
        const users = await userRepository.findAll();
        return users.map(toPublicProfile);
    },

    /**
     * Retrieves the public profile of the authenticated user.
     */
    async getProfile(userId: string): Promise<UserPublicProfile> {
        const user = await userRepository.findById(userId);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }
        return toPublicProfile(user);
    },

    /**
     * Updates mutable fields (name, phone) of the authenticated user's profile.
     */
    async updateProfile(
        userId: string,
        dto: UpdateUserDto,
    ): Promise<UserPublicProfile> {
        // Make sure the user exists first
        const existing = await userRepository.findById(userId);
        if (!existing) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }

        const updated = await userRepository.update(userId, dto);
        return toPublicProfile(updated);
    },

    /**
     * Uploads and updates the photo_url for a user.
     */
    async uploadPhoto(userId: string, fileBuffer: Buffer, mimetype: string): Promise<string> {
        const existing = await userRepository.findById(userId);
        if (!existing) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }

        const photoUrl = await userRepository.uploadPhoto(userId, fileBuffer, mimetype);
        await userRepository.updatePhotoUrl(userId, photoUrl);
        return photoUrl;
    },

    /**
     * Fetches any user by their ID. Accessible only to admins or the user themselves.
     * (Authorization is handled at the controller/middleware level.)
     */
    /**
     * Changes the password of the authenticated user.
     * Verifies the current password before hashing and persisting the new one.
     */
    async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
        // 1. Fetch raw user row (includes password_hash)
        const user = await userRepository.findRawById(userId);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }

        // 2. Verify current password
        const isMatch = await bcrypt.compare(dto.current_password, user.password_hash);
        if (!isMatch) {
            const err = new Error('La contraseña actual es incorrecta');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        // 3. Ensure new password is different
        const isSame = await bcrypt.compare(dto.new_password, user.password_hash);
        if (isSame) {
            const err = new Error('La nueva contraseña debe ser diferente a la actual');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        // 4. Hash new password and persist
        const newHash = await bcrypt.hash(dto.new_password, SALT_ROUNDS);
        await userRepository.updatePassword(userId, newHash);
    },

    /**
     * Fetches any user by their ID. Accessible only to admins or the user themselves.
     * (Authorization is handled at the controller/middleware level.)
     */
    async getUserById(id: string): Promise<UserPublicProfile> {
        const user = await userRepository.findById(id);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }
        return toPublicProfile(user);
    },
    /**
     * Finds a user by email address. Used by other microservices
     * (e.g. Pet Service) to look up an owner by email.
     * Returns only the minimal { id, name, email } shape.
     */
    async findUserByEmail(email: string): Promise<{ id: string; name: string; email: string }> {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }
        return { id: user.id, name: user.name, email: user.email };
    },
    /**
     * Finds a user by ID. Used by other microservices
     * (e.g. Pet Service, Appointment Service) to get basic user info.
     * Returns only the minimal { id, name, email, role, clinic_id } shape.
     */
    async findUserById(id: string): Promise<{ id: string; name: string; email: string; role: string; clinic_id: string | null; photo_url: string | null }> {
        const user = await userRepository.findById(id);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }
        return { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            role: user.roles?.role_name || '',
            clinic_id: user.clinic_id,
            photo_url: user.photo_url ?? null
        };
    },
};
