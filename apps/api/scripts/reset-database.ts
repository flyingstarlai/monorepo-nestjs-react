#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { RoleType } from '../src/users/entities/role.entity';

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const usersService = app.get(UsersService);
  const authService = app.get(AuthService);

  try {
    // Get all table names
    const tables = await dataSource.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%migration%'
    `);
    
    console.log('📋 Found tables:', tables.map(t => t.name));

    // Drop all tables in correct order (respecting foreign keys)
    const dropOrder = ['activities', 'users', 'roles'];
    
    for (const tableName of dropOrder) {
      try {
        await dataSource.query(`DROP TABLE IF EXISTS ${tableName}`);
        console.log(`🗑️  Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Table ${tableName} might not exist:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Recreate tables using TypeORM synchronization
    await dataSource.synchronize(true);
    console.log('🏗️  Database schema recreated');

    // Seed roles
    console.log('🌱 Seeding roles...');
    await usersService.seedRoles();
    console.log('✅ Roles seeded successfully');

    // Seed admin user
    console.log('👤 Creating admin user...');
    const adminRole = await usersService.findRoleByName(RoleType.ADMIN);
    if (adminRole) {
      const hashedPassword = await authService.hashPassword('nimda');
      await usersService.create({
        username: 'admin',
        name: 'Admin User',
        password: hashedPassword,
        role: adminRole,
        isActive: true,
      });
      console.log('✅ Admin user created successfully');
    }

    // Seed regular user
    console.log('👤 Creating regular user...');
    const userRole = await usersService.findRoleByName(RoleType.USER);
    if (userRole) {
      const hashedPassword = await authService.hashPassword('user123');
      await usersService.create({
        username: 'user',
        name: 'Regular User',
        password: hashedPassword,
        role: userRole,
        isActive: true,
      });
      console.log('✅ Regular user created successfully');
    }

    console.log('🎉 Database reset and seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script
resetDatabase()
  .then(() => {
    console.log('✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });