import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityType } from './entities/activity.entity';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: jest.Mocked<ActivitiesService>;

  const mockActivitiesResponse = {
    items: [
      {
        id: 'activity-1',
        type: ActivityType.LOGIN_SUCCESS,
        message: 'Successfully logged in',
        createdAt: '2023-01-01T00:00:00Z',
      },
    ],
    nextCursor: '2023-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    const mockActivitiesService = {
      findByOwner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get(ActivitiesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return activities for authenticated user', async () => {
      const mockUser = { id: 'user-id', username: 'test' };
      const mockRequest = { user: mockUser };

      service.findByOwner.mockResolvedValue(mockActivitiesResponse);

      const result = await controller.findAll(mockRequest, 20, undefined);

      expect(service.findByOwner).toHaveBeenCalledWith('user-id', { limit: 20, cursor: undefined });
      expect(result).toEqual(mockActivitiesResponse);
    });

    it('should use custom limit and cursor', async () => {
      const mockUser = { id: 'user-id', username: 'test' };
      const mockRequest = { user: mockUser };

      service.findByOwner.mockResolvedValue(mockActivitiesResponse);

      await controller.findAll(mockRequest, 10, '2023-01-01T00:00:00Z');

      expect(service.findByOwner).toHaveBeenCalledWith('user-id', {
        limit: 10,
        cursor: '2023-01-01T00:00:00Z',
      });
    });
  });
});