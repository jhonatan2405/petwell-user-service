import { supabase } from '../config/supabase';
import {
    UserRow,
    UserWithRole,
    CreateUserDto,
    UpdateUserDto,
    ChangePasswordDto,
} from '../models/user.model';

// -----------------------------------------------------------------------
// User Repository – all Supabase interactions for the users table.
// Business logic stays in the service layer; this layer only does DB I/O.
// -----------------------------------------------------------------------

export const userRepository = {
    /**
     * Find a user by email address (used during login and duplicate check).
     */
    async findByEmail(email: string): Promise<UserWithRole | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*, roles(*), clinics(logo_url)')
            .eq('email', email.toLowerCase().trim())
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return (data as UserWithRole) ?? null;
    },

    /**
     * Find a user by primary key, joined with role data.
     */
    async findById(id: string): Promise<UserWithRole | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*, roles(*), clinics(logo_url)')
            .eq('id', id)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return (data as UserWithRole) ?? null;
    },

    /**
     * Insert a new user row. Returns the created row.
     */
    async create(
        dto: Omit<UserRow, 'id' | 'created_at' | 'updated_at'>,
    ): Promise<UserWithRole> {
        const { data, error } = await supabase
            .from('users')
            .insert(dto)
            .select('*, roles(*), clinics(logo_url)')
            .single();

        if (error) throw new Error(error.message);
        return data as UserWithRole;
    },

    /**
     * Update allowed fields of a user profile.
     */
    async update(id: string, dto: UpdateUserDto): Promise<UserWithRole> {
        const { data, error } = await supabase
            .from('users')
            .update(dto)
            .eq('id', id)
            .select('*, roles(*), clinics(logo_url)')
            .single();

        if (error) throw new Error(error.message);
        return data as UserWithRole;
    },

    /**
     * Fetch the default role id for "DUENO_MASCOTA" – used as the fallback
     * when no role is specified during registration.
     */
    async getDefaultRoleId(): Promise<number> {
        const { data, error } = await supabase
            .from('roles')
            .select('id')
            .eq('role_name', 'DUENO_MASCOTA')
            .single();

        if (error) throw new Error(error.message);
        return (data as { id: number }).id;
    },

    /**
     * Verify a role id exists in the roles table.
     */
    async roleExists(roleId: number): Promise<boolean> {
        const { data } = await supabase
            .from('roles')
            .select('id')
            .eq('id', roleId)
            .maybeSingle();

        return !!data;
    },

    /**
     * Get a role id by its role_name string.
     */
    async getRoleIdByName(roleName: string): Promise<number> {
        const { data, error } = await supabase
            .from('roles')
            .select('id')
            .eq('role_name', roleName)
            .single();

        if (error) throw new Error(`Rol '${roleName}' no encontrado en la base de datos`);
        return (data as { id: number }).id;
    },

    /**
     * Retrieve all users joined with their role data.
     * Ordered by creation date (newest first). Excludes password_hash.
     */
    async findAll(): Promise<UserWithRole[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*, roles(*)')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data as UserWithRole[]) ?? [];
    },

    /**
     * Update the password_hash of a user. Used by the change-password flow.
     */
    async updatePassword(id: string, password_hash: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ password_hash })
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    /**
     * Fetch a single user row by id INCLUDING the password_hash field.
     * Only used internally to verify the current password.
     */
    async findRawById(id: string): Promise<UserRow | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return (data as UserRow) ?? null;
    },

    // ── Photo upload ────────────────────────────────────────────────────────
    
    /**
     * Upload a photo to Supabase Storage bucket 'user-avatars' and return the public URL.
     * Overwrites any existing photo for this user (same path).
     */
    async uploadPhoto(userId: string, fileBuffer: Buffer, mimetype: string): Promise<string> {
        const ext = mimetype.split('/')[1] ?? 'jpg';
        const filePath = `${userId}/photo.${ext}`;

        const { error } = await supabase.storage
            .from('user-avatars')
            .upload(filePath, fileBuffer, {
                contentType: mimetype,
                upsert: true,
            });

        if (error) {
            if (error.message.includes('bucket') || error.message.includes('not found')) {
                throw new Error('El bucket "user-avatars" no existe en Supabase Storage. Créalo y hazlo público.');
            }
            throw new Error(`Error subiendo foto de usuario: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from('user-avatars')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    },

    /**
     * Update the photo_url field in the users table.
     */
    async updatePhotoUrl(userId: string, photoUrl: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ photo_url: photoUrl })
            .eq('id', userId);

        if (error) throw new Error(error.message);
    },
};

// Re-export DTOs so the service layer doesn't need an extra import
export type { CreateUserDto, UpdateUserDto, ChangePasswordDto };
