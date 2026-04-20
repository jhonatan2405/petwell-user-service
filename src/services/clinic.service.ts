import bcrypt from 'bcrypt';
import { clinicRepository, toClinicPublicProfile } from '../repositories/clinic.repository';
import { userRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt.util';
import {
    RegisterClinicDto,
    RegisterClinicResponse,
    ClinicPublicProfile,
    ClinicStaffMember,
} from '../models/clinic.model';
import { UserRole } from '../models/user.model';

const SALT_ROUNDS = 12;

export const clinicService = {
    /**
     * Registers a new clinic AND creates a CLINIC_ADMIN user in one operation.
     */
    async registerClinic(dto: RegisterClinicDto): Promise<RegisterClinicResponse> {
        // 1a. Duplicate email check
        const existingUser = await userRepository.findByEmail(dto.email);
        if (existingUser) {
            const err = new Error('El correo electrónico ya está registrado');
            (err as { statusCode?: number }).statusCode = 409;
            throw err;
        }

        // 1b. Duplicate tax_id check
        const existingClinic = await clinicRepository.findByTaxId(dto.tax_id);
        if (existingClinic) {
            const err = new Error('Ya existe una clínica registrada con ese RUC / NIT');
            (err as { statusCode?: number }).statusCode = 409;
            throw err;
        }

        // 2. Create clinic
        const clinic = await clinicRepository.create({
            name: dto.clinic_name.trim(),
            address: dto.address.trim(),
            city: dto.city.trim(),
            phone: dto.phone.trim(),
            tax_id: dto.tax_id.trim(),
            logo_url: null,
            opening_hours: dto.opening_hours?.trim() ?? null,
            specialties: dto.specialties?.trim() ?? null,
        });

        // 3. Resolve CLINIC_ADMIN role id
        const clinicAdminRoleId = await userRepository.getRoleIdByName(UserRole.CLINIC_ADMIN);

        // 4. Hash admin password
        const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        // 5. Create admin user linked to clinic
        const adminUser = await userRepository.create({
            name: dto.admin_name.trim(),
            email: dto.email.toLowerCase().trim(),
            password_hash,
            phone: dto.phone ?? null,
            role_id: clinicAdminRoleId,
            clinic_id: clinic.id,
            photo_url: null,
            license_number: null,
            is_active: true,
            is_verified: true,
            verification_code: null,
            verification_expires: null,
            reset_code: null,
            reset_expires: null,
        });

        // 6. Issue JWT
        const token = generateToken({
            sub: adminUser.id,
            email: adminUser.email,
            role: UserRole.CLINIC_ADMIN,
            clinic_id: clinic.id,
        });

        return {
            clinic: toClinicPublicProfile(clinic),
            admin: {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
                role: UserRole.CLINIC_ADMIN,
                clinic_id: clinic.id,
            },
            token,
        };
    },

    /**
     * Returns the public profile of a single clinic.
     */
    async getClinic(clinicId: string): Promise<ClinicPublicProfile> {
        const clinic = await clinicRepository.findById(clinicId);
        if (!clinic) {
            const err = new Error('Clínica no encontrada');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }
        return toClinicPublicProfile(clinic);
    },

    /**
     * Uploads and updates the logo_url for a clinic.
     */
    async uploadLogo(clinicId: string, fileBuffer: Buffer, mimetype: string): Promise<string> {
        const existing = await clinicRepository.findById(clinicId);
        if (!existing) {
            const err = new Error('Clínica no encontrada');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }

        const logoUrl = await clinicRepository.uploadLogo(clinicId, fileBuffer, mimetype);
        await clinicRepository.updateLogoUrl(clinicId, logoUrl);
        return logoUrl;
    },

    /**
     * Returns all active users (staff) associated with the given clinic.
     */
    async getClinicStaff(clinicId: string): Promise<ClinicStaffMember[]> {
        // Verify the clinic exists first
        const clinic = await clinicRepository.findById(clinicId);
        if (!clinic) {
            const err = new Error('Clínica no encontrada');
            (err as { statusCode?: number }).statusCode = 404;
            throw err;
        }
        return clinicRepository.findStaffByClinicId(clinicId);
    },
    /**
     * Returns all active clinics as a minimal { id, name } list
     * for use in frontend select inputs.
     */
    async getAllClinics(): Promise<{ id: string; name: string }[]> {
        const clinics = await clinicRepository.findAll();
        return clinics.map((c) => ({ id: c.id, name: c.name }));
    },
};

