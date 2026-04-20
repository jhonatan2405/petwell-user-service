import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/user.repository';
import { UserRole, UserPublicProfile, UserWithRole } from '../models/user.model';
import { CreateVeterinarianDto, CreateReceptionistDto, CreateStaffDto } from '../models/clinic.model';

const SALT_ROUNDS = 12;

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

export const staffService = {
    /**
     * Creates a VETERINARIO user associated with the authenticated admin's clinic.
     * Only callable by CLINIC_ADMIN users.
     */
    async createVeterinarian(
        adminClinicId: string,
        dto: CreateVeterinarianDto,
    ): Promise<UserPublicProfile> {
        // 1. Duplicate email check
        const existing = await userRepository.findByEmail(dto.email);
        if (existing) {
            const err = new Error('El correo electrónico ya está registrado');
            (err as { statusCode?: number }).statusCode = 409;
            throw err;
        }

        // 2. Resolve VETERINARIO role
        const roleId = await userRepository.getRoleIdByName(UserRole.VETERINARIO);

        // 3. Hash password
        const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        // 4. Persist
        const newUser = await userRepository.create({
            name: dto.name.trim(),
            email: dto.email.toLowerCase().trim(),
            password_hash,
            phone: dto.phone?.trim() ?? null,
            role_id: roleId,
            clinic_id: adminClinicId,
            photo_url: null,
            license_number: dto.license_number?.trim() ?? null,
            is_active: true,
            is_verified: true,
            verification_code: null,
            verification_expires: null,
            reset_code: null,
            reset_expires: null,
        });

        return toPublicProfile(newUser);
    },

    /**
     * Creates a clinic staff member (VETERINARIO or RECEPCIONISTA) associated
     * with the authenticated admin's clinic.
     * Only callable by CLINIC_ADMIN users.
     */
    async createStaff(
        adminClinicId: string,
        dto: CreateStaffDto,
    ): Promise<UserPublicProfile> {
        // 1. Validate role
        const allowedRoles: string[] = [UserRole.VETERINARIO, UserRole.RECEPCIONISTA];
        if (!allowedRoles.includes(dto.role)) {
            const err = new Error('Rol no válido. Debe ser VETERINARIO o RECEPCIONISTA');
            (err as { statusCode?: number }).statusCode = 400;
            throw err;
        }

        // 2. Duplicate email check
        const existing = await userRepository.findByEmail(dto.email);
        if (existing) {
            const err = new Error('El correo electrónico ya está registrado');
            (err as { statusCode?: number }).statusCode = 409;
            throw err;
        }

        // 3. Resolve role id
        const roleId = await userRepository.getRoleIdByName(dto.role);

        // 4. Hash password
        const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        // 5. Persist
        const newUser = await userRepository.create({
            name: dto.name.trim(),
            email: dto.email.toLowerCase().trim(),
            password_hash,
            phone: null,
            role_id: roleId,
            clinic_id: adminClinicId,
            photo_url: null,
            license_number: dto.license_number?.trim() ?? null,
            is_active: true,
            is_verified: true,
            verification_code: null,
            verification_expires: null,
            reset_code: null,
            reset_expires: null,
        });

        return toPublicProfile(newUser);
    },

    /**
     * Creates a RECEPCIONISTA user associated with the authenticated admin's clinic.
     * Only callable by CLINIC_ADMIN users.
     */
    async createReceptionist(
        adminClinicId: string,
        dto: CreateReceptionistDto,
    ): Promise<UserPublicProfile> {
        // 1. Duplicate email check
        const existing = await userRepository.findByEmail(dto.email);
        if (existing) {
            const err = new Error('El correo electrónico ya está registrado');
            (err as { statusCode?: number }).statusCode = 409;
            throw err;
        }

        // 2. Resolve RECEPCIONISTA role
        const roleId = await userRepository.getRoleIdByName(UserRole.RECEPCIONISTA);

        // 3. Hash password
        const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        // 4. Persist
        const newUser = await userRepository.create({
            name: dto.name.trim(),
            email: dto.email.toLowerCase().trim(),
            password_hash,
            phone: dto.phone?.trim() ?? null,
            role_id: roleId,
            clinic_id: adminClinicId,
            photo_url: null,
            license_number: null,
            is_active: true,
            is_verified: true,
            verification_code: null,
            verification_expires: null,
            reset_code: null,
            reset_expires: null,
        });

        return toPublicProfile(newUser);
    },
};
