import { userService } from '../../src/services/user.service';
import { userRepository } from '../../src/repositories/user.repository';
import bcrypt from 'bcrypt';

jest.mock('../../src/repositories/user.repository');
jest.mock('bcrypt');

describe('User Service Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockUser: any = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '123456789',
        roles: { id: 1, role_name: 'Owner' },
        clinic_id: 'clinic-1',
        photo_url: 'photo.jpg',
        is_active: true,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        clinics: { logo_url: 'logo.png' },
        password_hash: 'hashed'
    };

    describe('listAllUsers', () => {
        it('should return all users', async () => {
            (userRepository.findAll as jest.Mock).mockResolvedValue([mockUser]);
            const result = await userService.listAllUsers();
            expect(result).toHaveLength(1);
            expect(result[0].email).toBe('test@example.com');
            expect(result[0].clinic_logo_url).toBe('logo.png');
        });
    });

    describe('getProfile', () => {
        it('should return user profile', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
            const result = await userService.getProfile('user-1');
            expect(result.id).toBe('user-1');
            expect(result.role).toBe('Owner');
        });

        it('should throw 404 if user not found', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(userService.getProfile('none')).rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('updateProfile', () => {
        it('should update profile', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
            (userRepository.update as jest.Mock).mockResolvedValue({ ...mockUser, name: 'New' });
            const result = await userService.updateProfile('user-1', { name: 'New' });
            expect(result.name).toBe('New');
        });

        it('should throw 404 if user not found', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(userService.updateProfile('none', {})).rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('uploadPhoto', () => {
        it('should upload photo', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
            (userRepository.uploadPhoto as jest.Mock).mockResolvedValue('url');
            const result = await userService.uploadPhoto('user-1', Buffer.from('test'), 'image/png');
            expect(result).toBe('url');
            expect(userRepository.updatePhotoUrl).toHaveBeenCalledWith('user-1', 'url');
        });

        it('should throw 404 if user not found', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(userService.uploadPhoto('none', Buffer.from('test'), 'png')).rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('changePassword', () => {
        const dto = { current_password: 'old', new_password: 'new' };
        it('should throw 404 if user not found', async () => {
            (userRepository.findRawById as jest.Mock).mockResolvedValue(null);
            await expect(userService.changePassword('none', dto)).rejects.toThrow('Usuario no encontrado');
        });

        it('should throw 400 if current password incorrect', async () => {
            (userRepository.findRawById as jest.Mock).mockResolvedValue({ password_hash: 'hash' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(userService.changePassword('1', dto)).rejects.toThrow('La contraseña actual es incorrecta');
        });

        it('should throw 400 if new password same as old', async () => {
            (userRepository.findRawById as jest.Mock).mockResolvedValue({ password_hash: 'hash' });
            (bcrypt.compare as jest.Mock).mockImplementation((plain) => {
                if (plain === 'old') return Promise.resolve(true); // current_password check
                if (plain === 'new') return Promise.resolve(true); // isSame check
                return Promise.resolve(false);
            });
            await expect(userService.changePassword('1', dto)).rejects.toThrow('La nueva contraseña debe ser diferente a la actual');
        });

        it('should change password successfully', async () => {
            (userRepository.findRawById as jest.Mock).mockResolvedValue({ id: '1', password_hash: 'hash' });
            (bcrypt.compare as jest.Mock).mockImplementation((plain) => {
                if (plain === 'old') return Promise.resolve(true); // current_password check
                if (plain === 'new') return Promise.resolve(false); // isSame check
                return Promise.resolve(false);
            });
            (bcrypt.hash as jest.Mock).mockResolvedValue('newhash');
            await userService.changePassword('1', dto);
            expect(userRepository.updatePassword).toHaveBeenCalledWith('1', 'newhash');
        });
    });

    describe('getUserById', () => {
        it('should return user profile', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
            const result = await userService.getUserById('user-1');
            expect(result.id).toBe('user-1');
        });

        it('should throw 404 if not found', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(userService.getUserById('1')).rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('findUserByEmail', () => {
        it('should return user info', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            const result = await userService.findUserByEmail('test@test.com');
            expect(result.email).toBe('test@example.com');
        });

        it('should throw 404 if not found', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            await expect(userService.findUserByEmail('none')).rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('findUserById', () => {
        it('should return user basic info', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
            const result = await userService.findUserById('1');
            expect(result.role).toBe('Owner');
        });

        it('should return empty role if missing', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue({ ...mockUser, roles: null });
            const result = await userService.findUserById('1');
            expect(result.role).toBe('');
        });

        it('should throw 404 if not found', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(userService.findUserById('1')).rejects.toThrow('Usuario no encontrado');
        });
    });
});
