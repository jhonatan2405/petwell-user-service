import { supabase } from '../config/supabase';
import { ClinicRow, ClinicPublicProfile, ClinicStaffMember } from '../models/clinic.model';

// -----------------------------------------------------------------------
// Clinic Repository – all Supabase interactions for the clinics table.
// -----------------------------------------------------------------------

export const clinicRepository = {
    /**
     * Insert a new clinic row. Returns the created row.
     */
    async create(
        dto: Omit<ClinicRow, 'id' | 'created_at'>,
    ): Promise<ClinicRow> {
        const { data, error } = await supabase
            .from('clinics')
            .insert(dto)
            .select('*')
            .single();

        if (error) throw new Error(error.message);
        return data as ClinicRow;
    },

    /**
     * Find a clinic by its primary key.
     */
    async findById(id: string): Promise<ClinicRow | null> {
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return (data as ClinicRow) ?? null;
    },

    /**
     * Find a clinic by tax_id (RNC / NIT) to prevent duplicates.
     */
    async findByTaxId(tax_id: string): Promise<ClinicRow | null> {
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('tax_id', tax_id)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return (data as ClinicRow) ?? null;
    },

    /**
     * Retrieve all clinics ordered by creation date.
     */
    async findAll(): Promise<ClinicRow[]> {
        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data as ClinicRow[]) ?? [];
    },
    /**
     * Retrieve all staff (VETERINARIO, RECEPCIONISTA) belonging to a specific clinic,
     * joined with their role. Excludes CLINIC_ADMIN from the staff listing.
     */
    async findStaffByClinicId(clinicId: string): Promise<ClinicStaffMember[]> {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, phone, license_number, created_at, roles!inner(role_name)')
            .eq('clinic_id', clinicId)
            .eq('is_active', true)
            .in('roles.role_name', ['VETERINARIO', 'RECEPCIONISTA'])
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);

        // Supabase FK join returns `roles` as a single object (not an array).
        // Cast through unknown to handle the shape correctly.
        type RawRow = {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            license_number: string | null;
            created_at: string;
            roles: { role_name: string };
        };

        return ((data ?? []) as unknown as RawRow[]).map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            role: row.roles?.role_name ?? '',
            license_number: row.license_number,
            created_at: row.created_at,
        }));
    },
    
    // ── Logo upload ────────────────────────────────────────────────────────
    
    /**
     * Upload a logo to Supabase Storage bucket 'clinic-logos' and return the public URL.
     * Overwrites any existing logo for this clinic (same path).
     */
    async uploadLogo(clinicId: string, fileBuffer: Buffer, mimetype: string): Promise<string> {
        const ext = mimetype.split('/')[1] ?? 'png';
        const filePath = `${clinicId}/logo.${ext}`;

        const { error } = await supabase.storage
            .from('clinic-logos')
            .upload(filePath, fileBuffer, {
                contentType: mimetype,
                upsert: true,
            });

        if (error) {
            if (error.message.includes('bucket') || error.message.includes('not found')) {
                throw new Error('El bucket "clinic-logos" no existe en Supabase Storage. Créalo y hazlo público.');
            }
            throw new Error(`Error subiendo logo de clínica: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from('clinic-logos')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    },

    /**
     * Update the logo_url field in the clinics table.
     */
    async updateLogoUrl(clinicId: string, logoUrl: string): Promise<void> {
        const { error } = await supabase
            .from('clinics')
            .update({ logo_url: logoUrl })
            .eq('id', clinicId);

        if (error) throw new Error(error.message);
    },
};

// Helper: map a DB row to a safe public profile
export const toClinicPublicProfile = (clinic: ClinicRow): ClinicPublicProfile => ({
    id: clinic.id,
    name: clinic.name,
    address: clinic.address,
    city: clinic.city,
    phone: clinic.phone,
    tax_id: clinic.tax_id,
    logo_url: clinic.logo_url,
    opening_hours: clinic.opening_hours,
    specialties: clinic.specialties,
    created_at: clinic.created_at,
});
