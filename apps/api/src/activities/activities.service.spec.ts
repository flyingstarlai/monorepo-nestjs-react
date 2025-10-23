import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ActivitiesService } from "./activities.service";
import { Activity, ActivityType } from "./entities/activity.entity";
import type { Mocked } from "jest-mock";

describe("ActivitiesService", () => {
	let service: ActivitiesService;
	let repository: Mocked<Repository<Activity>>;

	const mockActivity = {
		id: "activity-id",
		ownerId: "user-id",
		type: ActivityType.LOGIN_SUCCESS,
		message: "Successfully logged in",
		metadata: {},
		createdAt: new Date(),
	};

	beforeEach(async () => {
		const mockRepository = {
			create: jest.fn(),
			save: jest.fn(),
			createQueryBuilder: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ActivitiesService,
				{
					provide: getRepositoryToken(Activity),
					useValue: mockRepository,
				},
			],
		}).compile();

		service = module.get<ActivitiesService>(ActivitiesService);
		repository = module.get(getRepositoryToken(Activity)) as unknown as Mocked<
			Repository<Activity>
		>;
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("record", () => {
		it("should create and save an activity", async () => {
			repository.create.mockReturnValue(mockActivity);
			repository.save.mockResolvedValue(mockActivity);

			const result = await service.record(
				"user-id",
				ActivityType.LOGIN_SUCCESS,
				"Successfully logged in",
				{},
			);

			expect(repository.create).toHaveBeenCalledWith({
				ownerId: "user-id",
				type: ActivityType.LOGIN_SUCCESS,
				message: "Successfully logged in",
				metadata: {},
			});
			expect(repository.save).toHaveBeenCalledWith(mockActivity);
			expect(result).toEqual(mockActivity);
		});
	});

	describe("findByOwner", () => {
		it("should return activities for owner with default limit", async () => {
			const mockQueryBuilder = {
				where: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				getMany: jest.fn().mockResolvedValue([mockActivity]),
			};

			repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

			const result = await service.findByOwner("user-id");

			expect(repository.createQueryBuilder).toHaveBeenCalledWith("activity");
			expect(mockQueryBuilder.where).toHaveBeenCalledWith(
				"activity.ownerId = :ownerId",
				{
					ownerId: "user-id",
				},
			);
			expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
				"activity.createdAt",
				"DESC",
			);
			expect(mockQueryBuilder.limit).toHaveBeenCalledWith(21);
			expect(result).toEqual({
				items: [
					{
						id: "activity-id",
						type: ActivityType.LOGIN_SUCCESS,
						message: "Successfully logged in",
						createdAt: mockActivity.createdAt.toISOString(),
					},
				],
				nextCursor: undefined,
			});
		});

		it("should handle cursor pagination", async () => {
			const cursorDate = new Date("2023-01-01T00:00:00Z");
			const mockQueryBuilder = {
				where: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				getMany: jest.fn().mockResolvedValue([mockActivity]),
			};

			repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

			await service.findByOwner("user-id", {
				limit: 5,
				cursor: cursorDate.toISOString(),
			});

			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
				"(activity.createdAt < :cursor OR (activity.createdAt = :cursor AND activity.id < :cursorId))",
				{
					cursor: cursorDate.toISOString(),
					cursorId: cursorDate.toISOString(),
				},
			);
			expect(mockQueryBuilder.limit).toHaveBeenCalledWith(6);
		});

		it("should return nextCursor when there are more items", async () => {
			const activities = Array(21).fill(mockActivity);
			const mockQueryBuilder = {
				where: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				getMany: jest.fn().mockResolvedValue(activities),
			};

			repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

			const result = await service.findByOwner("user-id");

			expect(result.nextCursor).toBeDefined();
			expect(result.items).toHaveLength(20);
		});
	});
});
