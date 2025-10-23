import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from 'supertest'
import {
	describe,
	it,
	expect,
	beforeEach,
	beforeAll,
	afterAll,
} from "@jest/globals";
import { Repository } from "typeorm";
import {
	Activity,
	ActivityType,
} from "../src/activities/entities/activity.entity";
import { AppModule } from "../src/app.module";
import { User } from "../src/users/entities/user.entity";
import { Role } from "../src/users/entities/role.entity";

describe("Activities (e2e)", () => {
	let app: INestApplication;
	let userRepository: Repository<User>;
	let activityRepository: Repository<Activity>;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		userRepository = moduleFixture.get<Repository<User>>(
			getRepositoryToken(User),
		);
		activityRepository = moduleFixture.get<Repository<Activity>>(
			getRepositoryToken(Activity),
		);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await activityRepository.clear();
		await userRepository.clear();
	});

	describe("/activities (GET)", () => {
		it("should return 401 for unauthenticated requests", () => {
			return request(app.getHttpServer()).get("/activities").expect(401);
		});

		it("should return activities for authenticated user after login", async () => {
			// Create a test user
			const user = await userRepository.save(
				userRepository.create({
					username: "testuser",
					name: "Test User",
					password: "hashedpassword",
					isActive: true,
					role: { id: "1", name: "User", description: "Regular user" } as Role,
				}),
			);

			// Login to get JWT token
			const loginResponse = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ username: "testuser", password: "testpassword" })
				.expect(200);

			const token = loginResponse.body.access_token;

			// Get activities
			const activitiesResponse = await request(app.getHttpServer())
				.get("/activities")
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			expect(activitiesResponse.body).toHaveProperty("items");
			expect(Array.isArray(activitiesResponse.body.items)).toBe(true);
			expect(activitiesResponse.body.items).toHaveLength(1);
			expect(activitiesResponse.body.items[0]).toMatchObject({
				type: ActivityType.LOGIN_SUCCESS,
				message: "Successfully logged in",
				ownerId: user.id,
			});
			expect(activitiesResponse.body.items[0]).toHaveProperty("createdAt");
			expect(activitiesResponse.body.items[0]).toHaveProperty("id");
		});

		it("should respect limit parameter", async () => {
			// Create a test user
			const user = await userRepository.save(
				userRepository.create({
					username: "testuser",
					name: "Test User",
					password: "hashedpassword",
					isActive: true,
					role: { id: "1", name: "User", description: "Regular user" } as Role,
				}),
			);

			// Create multiple activities
			for (let i = 0; i < 5; i++) {
				await activityRepository.save({
					ownerId: user.id,
					type: ActivityType.PROFILE_UPDATED,
					message: `Profile updated ${i}`,
					createdAt: new Date(Date.now() - i * 1000),
				});
			}

			// Login to get JWT token
			const loginResponse = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ username: "testuser", password: "testpassword" })
				.expect(200);

			const token = loginResponse.body.access_token;

			// Get activities with limit
			const activitiesResponse = await request(app.getHttpServer())
				.get("/activities?limit=3")
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			expect(activitiesResponse.body.items).toHaveLength(3);
		});

		it("should return empty array for user with no activities", async () => {
			// Create a test user
			await userRepository.save(
				userRepository.create({
					username: "testuser",
					name: "Test User",
					password: "hashedpassword",
					isActive: true,
					role: { id: "1", name: "User", description: "Regular user" } as Role,
				}),
			);

			// Login to get JWT token (this creates a login activity)
			const loginResponse = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ username: "testuser", password: "testpassword" })
				.expect(200);

			const token = loginResponse.body.access_token;

			// Clear activities to simulate no activities
			await activityRepository.clear();

			// Get activities
			const activitiesResponse = await request(app.getHttpServer())
				.get("/activities")
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			expect(activitiesResponse.body.items).toHaveLength(0);
			expect(activitiesResponse.body.nextCursor).toBeUndefined();
		});
	});
});
