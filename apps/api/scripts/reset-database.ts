#!/usr/bin/env ts-node

import 'dotenv/config';
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
    console.log('🗑️  Clearing database objects (MSSQL)...');
    await dataSource.query(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      -- Drop all foreign keys
      SELECT @sql += N'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(tab.schema_id)) + '.' + QUOTENAME(tab.name) + ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';'
      FROM sys.foreign_keys fk
      JOIN sys.tables tab ON fk.parent_object_id = tab.object_id;
      IF LEN(@sql) > 0 EXEC sp_executesql @sql;

      -- Drop all tables
      SET @sql = N'';
      SELECT @sql += N'DROP TABLE ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + ';'
      FROM sys.tables;
      IF LEN(@sql) > 0 EXEC sp_executesql @sql;
    `);
    console.log('🏗️  Schema cleared successfully (MSSQL)');

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
