import { userRepository } from '../../src/repositories/user.repository';
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
        storage: {
            from: jest.fn().mockReturnThis(),
            upload: jest.fn(),
            getPublicUrl: jest.fn()
        }
    }
}));

describe('User Repository', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });



    describe('findByEmail', () => {
        it('should return user when found', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: '1', email: 'test@test.com' }, error: null })
            });

            const result = await userRepository.findByEmail('test@test.com');
            expect(result).toEqual({ id: '1', email: 'test@test.com' });
        });

        it('should throw error when db fails', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
            });

            await expect(userRepository.findByEmail('test@test.com')).rejects.toThrow('DB Error');
        });
    });

    describe('findById', () => {
        it('should return user when found', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
            });

            const result = await userRepository.findById('1');
            expect(result).toEqual({ id: '1' });
        });
        it('should throw error when db fails', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
            });
            await expect(userRepository.findById('1')).rejects.toThrow('err');
        });
    });

    describe('create', () => {
        it('should create user successfully', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
            });

            const result = await userRepository.create({ name: 'test', email: 't@t.com' } as any);
            expect(result).toEqual({ id: '1' });
        });
        it('should throw error when db fails', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
            });
            await expect(userRepository.create({} as any)).rejects.toThrow('err');
        });
    });

    describe('update', () => {
        it('should update user', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
            });

            const result = await userRepository.update('1', { name: 'New' });
            expect(result).toEqual({ id: '1' });
        });
    });

    describe('updateVerification', () => {
        it('should update verification', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null })
            });

            await expect(userRepository.updateVerification('1', { is_verified: true, verification_code: null, verification_expires: null })).resolves.not.toThrow();
        });
    });

    describe('updateResetData', () => {
        it('should update reset data', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null })
            });

            await expect(userRepository.updateResetData('1', { reset_code: '123', reset_expires: 'date' })).resolves.not.toThrow();
        });
    });

    describe('role management', () => {
        it('should get default role id', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 2 }, error: null })
            });
            const result = await userRepository.getDefaultRoleId();
            expect(result).toBe(2);
        });

        it('should return boolean if role exists', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 } })
            });
            const result = await userRepository.roleExists(1);
            expect(result).toBe(true);
        });

        it('should get role id by name', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 3 }, error: null })
            });
            const result = await userRepository.getRoleIdByName('ADMIN');
            expect(result).toBe(3);
        });
    });

    describe('findAll', () => {
        it('should find all users', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null })
            });
            const result = await userRepository.findAll();
            expect(result).toEqual([{ id: '1' }]);
        });
    });

    describe('updatePassword', () => {
        it('should update password', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null })
            });
            await expect(userRepository.updatePassword('1', 'hash')).resolves.not.toThrow();
        });
    });

    describe('findRawById', () => {
        it('should return raw user by id', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: '1', password_hash: 'hash' }, error: null })
            });
            const result = await userRepository.findRawById('1');
            expect(result).toEqual({ id: '1', password_hash: 'hash' });
        });
    });

    describe('photo management', () => {
        it('should upload photo', async () => {
            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({ error: null }),
                getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://url' } })
            });
            const result = await userRepository.uploadPhoto('1', Buffer.from(''), 'image/png');
            expect(result).toBe('http://url');
        });

        it('should throw error on upload if bucket error', async () => {
            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({ error: { message: 'bucket not found' } })
            });
            await expect(userRepository.uploadPhoto('1', Buffer.from(''), 'image/png')).rejects.toThrow('bucket "user-avatars" no existe');
        });

        it('should throw error on upload if other error', async () => {
            (supabase.storage.from as jest.Mock).mockReturnValue({
                upload: jest.fn().mockResolvedValue({ error: { message: 'other' } })
            });
            await expect(userRepository.uploadPhoto('1', Buffer.from(''), 'image/png')).rejects.toThrow('other');
        });

        it('should update photo url', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null })
            });
            await expect(userRepository.updatePhotoUrl('1', 'http://url')).resolves.not.toThrow();
        });
        
        it('should throw error on update photo url failure', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: { message: 'err' } })
            });
            await expect(userRepository.updatePhotoUrl('1', 'http://url')).rejects.toThrow('err');
        });
    });
});
