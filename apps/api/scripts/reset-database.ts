#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { SeedsService } from '../src/seeds/seeds.service';

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const seedsService = app.get(SeedsService);

  try {
    console.log('🗑️  Dropping existing schema...');
    await dataSource.query('DROP SCHEMA public CASCADE');
    await dataSource.query('CREATE SCHEMA public');
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('🏗️  Schema recreated successfully');

    console.log('🔁 Running migrations...');
    await dataSource.runMigrations();
    console.log('✅ Migrations applied');

    console.log('🌱 Seeding baseline data...');
    await seedsService.seed();
    console.log('🎉 Seeding completed');

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
