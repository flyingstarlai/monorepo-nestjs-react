import { Injectable, type OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class SeedsService implements OnModuleInit {
	constructor(
		private readonly dataSource: DataSource,
		private readonly usersService: UsersService,
		private readonly authService: AuthService,
	) {}

	async onModuleInit() {
		// Ensure migrations have been applied before seeding
		await this.dataSource.runMigrations();
		await this.seed();
	}

	async seed() {
		console.log("🌱 Starting database seeding...");

		// Seed roles
		await this.usersService.seedRoles();
		console.log("✅ Roles seeded successfully");

		// Create admin user
		const adminExists = await this.usersService.findByUsername("admin");
		if (!adminExists) {
			const adminRole = await this.usersService.findRoleByName("Admin");
			if (adminRole) {
				const hashedPassword = await this.authService.hashPassword("admin");
				await this.usersService.create({
					username: "admin",
					name: "Admin User",
					password: hashedPassword,
					role: adminRole,
					isActive: true,
				});
				console.log("✅ Admin user created successfully");
			}
		}

		// Create regular user
		const userExists = await this.usersService.findByUsername("user");
		if (!userExists) {
			const userRole = await this.usersService.findRoleByName("User");
			if (userRole) {
				const hashedPassword = await this.authService.hashPassword("user");
				await this.usersService.create({
					username: "user",
					name: "Regular User",
					password: hashedPassword,
					role: userRole,
					isActive: true,
				});
				console.log("✅ Regular user created successfully");
			}
		}

		console.log("🎉 Database seeding completed!");
	}
}
