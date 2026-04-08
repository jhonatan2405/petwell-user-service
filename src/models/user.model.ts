// =============================================
// PetWell User Service - Domain Models & Types
// =============================================

export enum UserRole {
    ADMIN = 'ADMIN',
    VETERINARIO = 'VETERINARIO',
    CLINICA = 'CLINICA',
    DUENO_MASCOTA = 'DUENO_MASCOTA',
    CLINIC_ADMIN = 'CLINIC_ADMIN',
    RECEPCIONISTA = 'RECEPCIONISTA',
}

// --- Database Row Shapes (match Supabase tables) ---

export interface RoleRow {
    id: number;
    role_name: string;
}

export interface UserRow {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    phone: string | null;
    role_id: number;
    clinic_id: string | null;
    photo_url: string | null;
    license_number: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserWithRole extends UserRow {
    roles: RoleRow;
    clinics?: { logo_url: string | null } | null;
}

// --- Application-level DTOs ---

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role_id?: number;
    clinic_id?: string;
    license_number?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    phone?: string;
}

export interface ChangePasswordDto {
    current_password: string;
    new_password: string;
}

// --- API Response Shapes ---

export interface UserPublicProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    clinic_id: string | null;
    photo_url: string | null;
    clinic_logo_url?: string | null;
    license_number: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    token: string;
    user: UserPublicProfile;
}

// --- JWT Payload ---

export interface JwtPayload {
    sub: string;       // user id
    email: string;
    role: string;
    clinic_id?: string | null;
    iat?: number;
    exp?: number;
}
