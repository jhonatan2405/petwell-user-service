import { clinicRepository, toClinicPublicProfile } from '../../src/repositories/clinic.repository';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        storage: {
            from: jest.fn().mockReturnThis(),
            upload: jest.fn(),
            getPublicUrl: jest.fn()
        }
    }
}));

describe('Clinic Repository', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create clinic', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
            });

            const result = await clinicRepository.create({ name: 'Clinic' } as any);
            expect(result.id).toBe('1');
        });
        it('should throw error when db fails', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
            });
            await expect(clinicRepository.create({} as any)).rejects.toThrow('err');
        });
    });

    describe('findById', () => {
        it('should find clinic by id', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
            });

            const result = await clinicRepository.findById('1');
            expect(result).toEqual({ id: '1' });
        });
        it('should throw error when db fails', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
            });
            await expect(clinicRepository.findById('1')).rejects.toThrow('err');
        });
    });

    describe('findByTaxId', () => {
        it('should find clinic by tax id', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
            });

            const result = await clinicRepository.findByTaxId('tax');
            expect(result).toEqual({ id: '1' });
        });
    });

    describe('findAll', () => {
        it('should return all clinics', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null })
            });

            const result = await clinicRepository.findAll();
            expect(result).toEqual([{ id: '1' }]);
        });
    });

    describe('findStaffByClinicId', () => {
        it('should return staff mapped correctly', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: [{ id: '1', roles: { role_name: 'VET' } }], error: null })
            });

            const result = await clinicRepository.findStaffByClinicId('1');
            expect(result).toEqual([{ id: '1', role: 'VET', name: undefined, email: undefined, phone: undefined, license_number: undefined, created_at: undefined }]);
        });
    });

    describe('uploadLogo', () => {
        it('should upload logo and return url', async () => {
            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({ error: null }),
                getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'url' } })
            });

            const result = await clinicRepository.uploadLogo('1', Buffer.from(''), 'image/png');
            expect(result).toBe('url');
        });
        it('should throw error if bucket not found', async () => {
            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({ error: { message: 'bucket not found' } })
            });
            await expect(clinicRepository.uploadLogo('1', Buffer.from(''), 'image/png')).rejects.toThrow('bucket "clinic-logos" no existe');
        });
        it('should throw error if generic error', async () => {
            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({ error: { message: 'generic' } })
            });
            await expect(clinicRepository.uploadLogo('1', Buffer.from(''), 'image/png')).rejects.toThrow('generic');
        });
    });

    describe('updateLogoUrl', () => {
        it('should update logo url', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null })
            });

            await expect(clinicRepository.updateLogoUrl('1', 'url')).resolves.not.toThrow();
        });
        it('should throw error if update fails', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: { message: 'err' } })
            });

            await expect(clinicRepository.updateLogoUrl('1', 'url')).rejects.toThrow('err');
        });
    });

    describe('toClinicPublicProfile', () => {
        it('should map to public profile correctly', () => {
            const row: any = { id: '1', name: 'A', extra: 'hide' };
            const result = toClinicPublicProfile(row);
            expect(result.id).toBe('1');
            expect((result as any).extra).toBeUndefined();
        });
    });
});
