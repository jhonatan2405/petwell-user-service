// =============================================
// PetWell User Service - Clinic Domain Models
// =============================================

// --- Database Row Shapes ---

export interface ClinicRow {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    tax_id: string;
    logo_url: string | null;
    opening_hours: string | null;
    specialties: string | null;
    created_at: string;
}

// --- Application-level DTOs ---

/**
 * Full registration DTO for a new clinic.
 * Creates the clinic + a CLINIC_ADMIN user in one operation.
 */
export interface RegisterClinicDto {
    clinic_name: string;
    admin_name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    city: string;
    tax_id: string;
    opening_hours?: string;
    specialties?: string;
}

/**
 * DTO for creating a veterinarian by a CLINIC_ADMIN.
 */
export interface CreateVeterinarianDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
    license_number: string;
}

/**
 * DTO for creating a receptionist by a CLINIC_ADMIN.
 */
export interface CreateReceptionistDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
}

/**
 * DTO for creating clinic staff (VETERINARIO or RECEPCIONISTA).
 */
export interface CreateStaffDto {
    name: string;
    email: string;
    password: string;
    role: 'VETERINARIO' | 'RECEPCIONISTA';
    license_number?: string;
}

// --- API Response Shapes ---

export interface ClinicPublicProfile {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    tax_id: string;
    logo_url: string | null;
    opening_hours: string | null;
    specialties: string | null;
    created_at: string;
}

/** Shape returned per member in GET /clinics/:id/staff */
export interface ClinicStaffMember {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    license_number: string | null;
    created_at: string;
}

export interface RegisterClinicResponse {
    clinic: ClinicPublicProfile;
    admin: {
        id: string;
        name: string;
        email: string;
        role: string;
        clinic_id: string;
    };
    token: string;
}
