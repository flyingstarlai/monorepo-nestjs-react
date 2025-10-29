import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentService } from '../environment.service';
import { WorkspaceConnectionManager } from '../connection-manager.service';
import { Environment } from '../entities/environment.entity';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from '../entities/workspace-member.entity';
import { ActivitiesService } from '../../activities/activities.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let environmentRepository: Repository<Environment>;
  let workspaceRepository: Repository<Workspace>;
  let memberRepository: Repository<WorkspaceMember>;
  let activitiesService: ActivitiesService;
  let connectionManager: WorkspaceConnectionManager;

  const mockWorkspaceId = 'workspace-123';
  const mockUserId = 'user-123';
  const mockEnvironment = {
    id: 'env-123',
    host: 'localhost',
    port: 1433,
    username: 'testuser',
    password: 'testpass',
    database: 'testdb',
    connectionTimeout: 30000,
    encrypt: false,
    connectionStatus: 'unknown',
    workspace: { id: mockWorkspaceId } as Workspace,
    createdBy: mockUserId,
    updatedBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockActivitiesService = {
      record: jest.fn(),
    };

    const mockConnectionManager = {
      testConnection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentService,
        {
          provide: getRepositoryToken(Environment),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Workspace),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: WorkspaceConnectionManager,
          useValue: mockConnectionManager,
        },
      ],
    }).compile();

    service = module.get<EnvironmentService>(EnvironmentService);
    environmentRepository = module.get<Repository<Environment>>(getRepositoryToken(Environment));
    workspaceRepository = module.get<Repository<Workspace>>(getRepositoryToken(Workspace));
    memberRepository = module.get<Repository<WorkspaceMember>>(getRepositoryToken(WorkspaceMember));
    activitiesService = module.get<ActivitiesService>(ActivitiesService);
    connectionManager = module.get<WorkspaceConnectionManager>(WorkspaceConnectionManager);
  });

  describe('findByWorkspace', () => {
    it('should return environment for workspace', async () => {
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue(mockEnvironment);

      const result = await service.findByWorkspace(mockWorkspaceId);

      expect(environmentRepository.findOne).toHaveBeenCalledWith({
        where: { workspace: { id: mockWorkspaceId } },
        relations: ['workspace'],
      });
      expect(result).toEqual(mockEnvironment);
    });

    it('should return null if no environment found', async () => {
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByWorkspace(mockWorkspaceId);

      expect(result).toBeNull();
    });
  });

  describe('createEnvironment', () => {
    it('should create environment for authorized user', async () => {
      const member = { userId: mockUserId, role: WorkspaceRole.OWNER, isActive: true };
      const workspace = { id: mockWorkspaceId, name: 'Test Workspace' };
      const createDto = {
        host: 'localhost',
        port: 1433,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
      };

      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);
      jest.spyOn(workspaceRepository, 'findOne').mockResolvedValue(workspace as any);
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(environmentRepository, 'create').mockReturnValue(mockEnvironment as any);
      jest.spyOn(environmentRepository, 'save').mockResolvedValue(mockEnvironment);

      const result = await service.createEnvironment(mockWorkspaceId, createDto, mockUserId);

      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId, userId: mockUserId, isActive: true },
      });
      expect(environmentRepository.create).toHaveBeenCalledWith({
        ...createDto,
        workspace,
        createdBy: mockUserId,
        connectionStatus: 'unknown',
      });
      expect(activitiesService.record).toHaveBeenCalledWith(
        mockUserId,
        'ENVIRONMENT_CREATED',
        'Environment configuration created for workspace "Test Workspace"',
        mockWorkspaceId
      );
      expect(result).toEqual(mockEnvironment);
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      const member = { userId: mockUserId, role: WorkspaceRole.MEMBER, isActive: true };
      const createDto = {
        host: 'localhost',
        port: 1433,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
      };

      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);

      await expect(
        service.createEnvironment(mockWorkspaceId, createDto, mockUserId)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if environment already exists', async () => {
      const member = { userId: mockUserId, role: WorkspaceRole.OWNER, isActive: true };
      const createDto = {
        host: 'localhost',
        port: 1433,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
      };

      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue(mockEnvironment);

      await expect(
        service.createEnvironment(mockWorkspaceId, createDto, mockUserId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateEnvironment', () => {
    it('should update environment for authorized user', async () => {
      const member = { userId: mockUserId, role: WorkspaceRole.OWNER, isActive: true };
      const updateDto = { host: 'newhost' };

      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue(mockEnvironment);
      jest.spyOn(environmentRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue({
        ...mockEnvironment,
        host: 'newhost',
      } as any);

      const result = await service.updateEnvironment(mockWorkspaceId, updateDto, mockUserId);

      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId, userId: mockUserId, isActive: true },
      });
      expect(environmentRepository.update).toHaveBeenCalledWith(mockEnvironment.id, {
        ...updateDto,
        updatedBy: mockUserId,
        connectionStatus: 'unknown',
        lastTestedAt: null,
      });
      expect(activitiesService.record).toHaveBeenCalledWith(
        mockUserId,
        'ENVIRONMENT_UPDATED',
        'Environment configuration updated for workspace "undefined"',
        mockWorkspaceId
      );
      expect(result).toEqual({
        ...mockEnvironment,
        host: 'newhost',
      });
    });

    it('should throw NotFoundException if environment not found', async () => {
      const member = { userId: mockUserId, role: WorkspaceRole.OWNER, isActive: true };
      const updateDto = { host: 'newhost' };

      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateEnvironment(mockWorkspaceId, updateDto, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('testConnection', () => {
    it('should test connection for authorized user', async () => {
      const member = { userId: mockUserId, role: WorkspaceRole.OWNER, isActive: true };
      const testDto = {
        host: 'localhost',
        port: 1433,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
      };

      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue(mockEnvironment);
      jest.spyOn(connectionManager, 'testConnection').mockResolvedValue({ success: true });
      jest.spyOn(environmentRepository, 'update').mockResolvedValue(undefined);

      const result = await service.testConnection(mockWorkspaceId, testDto, mockUserId);

      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId, userId: mockUserId, isActive: true },
      });
      expect(connectionManager.testConnection).toHaveBeenCalledWith(testDto);
      expect(environmentRepository.update).toHaveBeenCalledWith(mockEnvironment.id, {
        connectionStatus: 'connected',
        lastTestedAt: expect.any(Date),
      });
      expect(result).toEqual({
        success: true,
        message: 'Connection test successful',
      });
    });

    it('should handle failed connection test', async () => {
      const member = { userId: mockUserId, role: WorkspaceRole.OWNER, isActive: true };
      const testDto = {
        host: 'localhost',
        port: 1433,
        username: 'testuser',
        password: 'testpass',
        database: 'testdb',
      };

      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);
      jest.spyOn(environmentRepository, 'findOne').mockResolvedValue(mockEnvironment);
      jest.spyOn(connectionManager, 'testConnection').mockResolvedValue({
        success: false,
        error: 'Connection failed',
      });
      jest.spyOn(environmentRepository, 'update').mockResolvedValue(undefined);

      const result = await service.testConnection(mockWorkspaceId, testDto, mockUserId);

      expect(connectionManager.testConnection).toHaveBeenCalledWith(testDto);
      expect(environmentRepository.update).toHaveBeenCalledWith(mockEnvironment.id, {
        connectionStatus: 'failed',
        lastTestedAt: expect.any(Date),
      });
      expect(result).toEqual({
        success: false,
        message: 'Connection test failed',
        error: 'Connection failed',
      });
    });
  });

  describe('canUserEditEnvironment', () => {
    it('should return true for Owner', async () => {
      const member = { role: WorkspaceRole.OWNER, isActive: true };
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);

      const result = await service.canUserEditEnvironment(mockWorkspaceId, mockUserId);

      expect(result).toBe(true);
    });

    it('should return true for Author', async () => {
      const member = { role: WorkspaceRole.AUTHOR, isActive: true };
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);

      const result = await service.canUserEditEnvironment(mockWorkspaceId, mockUserId);

      expect(result).toBe(true);
    });

    it('should return false for Member', async () => {
      const member = { role: WorkspaceRole.MEMBER, isActive: true };
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(member as any);

      const result = await service.canUserEditEnvironment(mockWorkspaceId, mockUserId);

      expect(result).toBe(false);
    });

    it('should return false if no membership', async () => {
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(null);

      const result = await service.canUserEditEnvironment(mockWorkspaceId, mockUserId);

      expect(result).toBe(false);
    });
  });
});