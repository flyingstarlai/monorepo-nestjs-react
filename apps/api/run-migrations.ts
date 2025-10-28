import { AppDataSource } from './data-source';

async function runMigrations() {
  await AppDataSource.initialize();
  console.log('Database connected');
  
  try {
    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
  
  await AppDataSource.destroy();
}

runMigrations().catch(console.error);