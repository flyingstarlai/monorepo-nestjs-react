import { Test, TestingModule } from '@nestjs/testing';
import { PublishService } from './publish.service';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { StoredProcedure } from '../entities/stored-procedure.entity';
import { MssqlConnectionRegistry } from './mssql-connection-registry.service';
import { ActivitiesService } from '../../activities/activities.service';
import { IPublisher } from '../interfaces/publishing.interfaces';
import { PublisherService } from '../publishers/publisher.service';

describe('PublishService', () => {
  let service: PublishService;
  let mockRepository: jest.Mocked<Repository<StoredProcedure>>;
  let mockConnectionRegistry: jest.Mocked<MssqlConnectionRegistry>;
  let mockActivitiesService: jest.Mocked<ActivitiesService>;
  let mockConnection: jest.Mocked<DataSource>;
  let mockPublisher: jest.Mocked<IPublisher>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    } as any;

    mockConnection = {
      query: jest.fn(),
    } as any;

    mockConnectionRegistry = {
      getConnectionForWorkspace: jest.fn(),
    } as any;

    mockActivitiesService = {
      record: jest.fn(),
    } as any;

    mockPublisher = {
      precheck: jest.fn(),
      deploy: jest.fn(),
      verify: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishService,
        {
          provide: 'StoredProcedureRepository',
          useValue: mockRepository,
        },
        {
          provide: MssqlConnectionRegistry,
          useValue: mockConnectionRegistry,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: PublisherService,
          useValue: mockPublisher,
        },
      ],
    }).compile();

    service = module.get<PublishService>(PublishService);
  });

  describe('buildCreateProcedureSql', () => {
    it('should return SQL as-is when it already contains CREATE PROCEDURE header', () => {
      const procedureName = 'TestProc';
      const procedureSql = `CREATE PROCEDURE TestProc
AS
BEGIN
    SELECT 1
END`;

      const result = (service as any).buildCreateProcedureSql(
        procedureName,
        procedureSql
      );

      expect(result).toBe(procedureSql);
      expect(result).not.toContain('BEGIN TRY');
      expect(result).not.toContain('sp_executesql');
    });

    it('should return SQL as-is when it contains CREATE OR ALTER PROCEDURE header', () => {
      const procedureName = 'TestProc';
      const procedureSql = `CREATE OR ALTER PROCEDURE TestProc
AS
BEGIN
    SELECT 1
END`;

      const result = (service as any).buildCreateProcedureSql(
        procedureName,
        procedureSql
      );

      expect(result).toBe(procedureSql);
      expect(result).not.toContain('BEGIN TRY');
      expect(result).not.toContain('sp_executesql');
    });

    it('should wrap body-only SQL in CREATE OR ALTER PROCEDURE', () => {
      const procedureName = 'TestProc';
      const procedureSql = `SELECT 1
SELECT 2`;

      const result = (service as any).buildCreateProcedureSql(
        procedureName,
        procedureSql
      );

      expect(result).toBe(`CREATE OR ALTER PROCEDURE [TestProc] AS
SELECT 1
SELECT 2`);
    });

    it('should handle SQL with GO batch separators', () => {
      const procedureName = 'TestProc';
      const procedureSql = `CREATE PROCEDURE TestProc
AS
BEGIN
    SELECT 1
END
GO
-- Some comment`;

      const result = (service as any).buildCreateProcedureSql(
        procedureName,
        procedureSql
      );

      expect(result).not.toContain('GO');
      expect(result).toContain('CREATE PROCEDURE TestProc');
    });

    it('should handle complex SQL with nested BEGIN/END blocks', () => {
      const procedureName = 'TestProc';
      const procedureSql = `CREATE OR ALTER PROCEDURE TestProc
AS
BEGIN
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TestTable')
    BEGIN
        DROP TABLE TestTable
    END
    
    CREATE TABLE TestTable (Id INT)
END`;

      const result = (service as any).buildCreateProcedureSql(
        procedureName,
        procedureSql
      );

      expect(result).toBe(procedureSql);
      expect(result).not.toContain('BEGIN TRY');
      expect(result).not.toContain('sp_executesql');
    });

    it('should handle SQL with parameters', () => {
      const procedureName = 'TestProc';
      const procedureSql = `CREATE PROCEDURE TestProc
    @Id INT,
    @Name VARCHAR(100)
AS
BEGIN
    SELECT * FROM Users WHERE Id = @Id AND Name = @Name
END`;

      const result = (service as any).buildCreateProcedureSql(
        procedureName,
        procedureSql
      );

      expect(result).toBe(procedureSql);
      expect(result).toContain('@Id INT');
      expect(result).toContain('@Name VARCHAR(100)');
    });

    it('should handle SQL with TRY/CATCH blocks', () => {
      const procedureName = 'TestProc';
      const procedureSql = `CREATE PROCEDURE TestProc
AS
BEGIN
    BEGIN TRY
        INSERT INTO TestTable (Id) VALUES (1)
    END TRY
    BEGIN CATCH
        SELECT ERROR_MESSAGE() AS ErrorMessage
    END CATCH
END`;

      const result = (service as any).buildCreateProcedureSql(
        procedureName,
        procedureSql
      );

      expect(result).toBe(procedureSql);
      expect(result).toContain('BEGIN TRY');
      expect(result).toContain('BEGIN CATCH');
    });
  });

  describe('parseMssqlDeployError', () => {
    it('should parse line numbers from error messages', () => {
      const errorMessage = "Line 15: Incorrect syntax near ')'.";
      const result = (service as any).parseMssqlDeployError(errorMessage);

      expect(result).toBe(
        "Line 15: Incorrect syntax near ')'. → Check syntax near ')' and ensure proper SQL structure"
      );
    });

    it('should clean up SQL Server error prefixes', () => {
      const errorMessage =
        "Msg 102, Level 15, State 1, Line 5: Incorrect syntax near 'END'.";
      const result = (service as any).parseMssqlDeployError(errorMessage);

      expect(result).toBe(
        "Line 5: Incorrect syntax near 'END'. → Check syntax near 'END' and ensure proper SQL structure"
      );
    });

    it('should handle object already exists errors', () => {
      const errorMessage =
        "There is already an object named 'TestProc' in the database.";
      const result = (service as any).parseMssqlDeployError(errorMessage);

      expect(result).toBe(
        "There is already an object named 'TestProc' in the database. → Try using CREATE OR ALTER instead of CREATE"
      );
    });

    it('should return original error if no special parsing needed', () => {
      const errorMessage = 'Some other error message';
      const result = (service as any).parseMssqlDeployError(errorMessage);

      expect(result).toBe('Some other error message');
    });
  });
});
