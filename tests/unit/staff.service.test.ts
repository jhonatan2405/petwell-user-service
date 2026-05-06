import { staffService } from '../../src/services/staff.service';
import { userRepository } from '../../src/repositories/user.repository';
import bcrypt from 'bcrypt';
import { UserRole } from '../../src/models/user.model';

jest.mock('../../src/repositories/user.repository');
jest.mock('bcrypt');

describe('Staff Service Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockProfile = {
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        roles: { role_name: 'VETERINARIO' },
    };

    describe('createVeterinarian', () => {
        it('should throw error if email exists', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockProfile);

            await expect(staffService.createVeterinarian('clinic-1', {
                name: 'Test',
                email: 'test@example.com',
                password: 'password123',
                license_number: '123'
            })).rejects.toThrow('El correo electrónico ya está registrado');
        });

        it('should create veterinarian successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (userRepository.getRoleIdByName as jest.Mock).mockResolvedValue(2);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
            (userRepository.create as jest.Mock).mockResolvedValue(mockProfile);

            const result = await staffService.createVeterinarian('clinic-1', {
                name: 'Test',
                email: 'new@example.com',
                password: 'pass',
                license_number: '123'
            });

            expect(result.role).toBe('VETERINARIO');
        });
    });

    describe('createStaff', () => {
        it('should throw error for invalid role', async () => {
            await expect(staffService.createStaff('clinic-1', {
                name: 'Test', email: 'test@test.com', password: 'pass', role: 'ADMIN' as any
            })).rejects.toThrow('Rol no válido');
        });

        it('should throw error if email exists', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockProfile);
            await expect(staffService.createStaff('clinic-1', {
                name: 'Test', email: 'test@test.com', password: 'pass', role: UserRole.VETERINARIO
            })).rejects.toThrow('El correo electrónico ya está registrado');
        });

        it('should create staff successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (userRepository.getRoleIdByName as jest.Mock).mockResolvedValue(2);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
            (userRepository.create as jest.Mock).mockResolvedValue(mockProfile);

            const result = await staffService.createStaff('clinic-1', {
                name: 'Test', email: 'test@test.com', password: 'pass', role: UserRole.VETERINARIO
            });

            expect(result.role).toBe('VETERINARIO');
        });
    });

    describe('createReceptionist', () => {
        it('should throw error if email exists', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockProfile);
            await expect(staffService.createReceptionist('clinic-1', {
                name: 'Test', email: 'test@test.com', password: 'pass'
            })).rejects.toThrow('El correo electrónico ya está registrado');
        });

        it('should create receptionist successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (userRepository.getRoleIdByName as jest.Mock).mockResolvedValue(3);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
            (userRepository.create as jest.Mock).mockResolvedValue({ ...mockProfile, roles: { role_name: 'RECEPCIONISTA' } });

            const result = await staffService.createReceptionist('clinic-1', {
                name: 'Test', email: 'test@test.com', password: 'pass'
            });

            expect(result.role).toBe('RECEPCIONISTA');
        });
    });
});
