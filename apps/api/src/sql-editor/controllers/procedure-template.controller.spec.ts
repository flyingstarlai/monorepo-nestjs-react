import { Test, TestingModule } from '@nestjs/testing';
import { ProcedureTemplateController } from './procedure-template.controller';
import { ProcedureTemplateService } from '../services/procedure-template.service';
import { ProcedureTemplate } from '../entities/procedure-template.entity';

describe('ProcedureTemplateController', () => {
  let controller: ProcedureTemplateController;
  let service: ProcedureTemplateService;

  const mockTemplate: ProcedureTemplate = {
    id: 'test-id',
    name: 'Test Template',
    description: 'A test template',
    sqlTemplate: 'CREATE OR ALTER PROCEDURE {{procedureName}} AS BEGIN END',
    paramsSchema: {
      paramName: {
        name: 'paramName',
        type: 'string',
        required: false,
        default: 'default',
      },
    },
    createdBy: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-id',
    username: 'testuser',
    name: 'Test User',
    role: 'Admin',
  };

  beforeEach(async () => {
    const mockProcedureTemplateService = {
      getTemplates: jest.fn(),
      getTemplateById: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      renderTemplate: jest.fn(),
      validateTemplate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcedureTemplateController],
      providers: [
        {
          provide: ProcedureTemplateService,
          useValue: mockProcedureTemplateService,
        },
      ],
    }).compile();

    controller = module.get<ProcedureTemplateController>(ProcedureTemplateController);
    service = module.get<ProcedureTemplateService>(ProcedureTemplateService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTemplates', () => {
    it('should return an array of templates', async () => {
      const expectedTemplates = [mockTemplate];
      jest.spyOn(service, 'getTemplates').mockResolvedValue(expectedTemplates);

      const result = await controller.getTemplates();

      expect(service.getTemplates).toHaveBeenCalled();
      expect(result).toEqual(expectedTemplates);
    });
  });

  describe('getTemplate', () => {
    it('should return a single template', async () => {
      jest.spyOn(service, 'getTemplateById').mockResolvedValue(mockTemplate);

      const result = await controller.getTemplate('test-id');

      expect(service.getTemplateById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const createDto = {
        name: 'New Template',
        description: 'A new template',
        sqlTemplate: 'CREATE OR ALTER PROCEDURE {{procedureName}} AS BEGIN END',
        paramsSchema: {},
      };

      jest.spyOn(service, 'createTemplate').mockResolvedValue(mockTemplate);

      const result = await controller.createTemplate(createDto, { user: mockUser } as any);

      expect(service.createTemplate).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      const updateDto = {
        name: 'Updated Template',
      };

      jest.spyOn(service, 'updateTemplate').mockResolvedValue(mockTemplate);

      const result = await controller.updateTemplate('test-id', updateDto, { user: mockUser } as any);

      expect(service.updateTemplate).toHaveBeenCalledWith('test-id', updateDto, mockUser.id);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      jest.spyOn(service, 'deleteTemplate').mockResolvedValue(undefined);

      await controller.deleteTemplate('test-id');

      expect(service.deleteTemplate).toHaveBeenCalledWith('test-id');
    });
  });

  describe('renderTemplate', () => {
    it('should render a template with parameters', async () => {
      const renderDto = {
        procedureName: 'TestProcedure',
        parameters: { paramName: 'testValue' },
      };

      const expectedRender = {
        renderedSql: 'CREATE OR ALTER PROCEDURE TestProcedure AS BEGIN END',
        errors: [],
        warnings: [],
      };

      jest.spyOn(service, 'renderTemplate').mockResolvedValue({
        renderedSql: expectedRender.renderedSql,
        validation: { valid: true },
      });

      const result = await controller.renderTemplate('test-id', renderDto);

      expect(service.renderTemplate).toHaveBeenCalledWith('test-id', renderDto);
      expect(result).toEqual(expectedRender);
    });

    it('should return validation errors when rendering fails', async () => {
      const renderDto = {
        procedureName: 'TestProcedure',
        parameters: {},
      };

      const expectedRender = {
        renderedSql: '',
        errors: ['Required parameter missing'],
        warnings: [],
      };

      jest.spyOn(service, 'renderTemplate').mockResolvedValue({
        renderedSql: '',
        validation: { valid: false, errors: ['Required parameter missing'] },
      });

      const result = await controller.renderTemplate('test-id', renderDto);

      expect(service.renderTemplate).toHaveBeenCalledWith('test-id', renderDto);
      expect(result).toEqual(expectedRender);
    });
  });

  describe('validateTemplate', () => {
    it('should validate a template', async () => {
      const expectedValidation = {
        valid: true,
        errors: [],
        warnings: [],
      };

      jest.spyOn(service, 'getTemplateById').mockResolvedValue(mockTemplate);
      jest.spyOn(service, 'validateTemplate').mockResolvedValue(expectedValidation);

      const result = await controller.validateTemplate('test-id');

      expect(service.getTemplateById).toHaveBeenCalledWith('test-id');
      expect(service.validateTemplate).toHaveBeenCalledWith(
        mockTemplate.sqlTemplate,
        mockTemplate.paramsSchema
      );
      expect(result).toEqual(expectedValidation);
    });
  });
});