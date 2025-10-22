#!/usr/bin/env ts-node

import AppDataSource from '../data-source';

type MigrationCommand = 'run' | 'revert';

const command = (process.argv[2] as MigrationCommand | undefined) ?? 'run';

async function bootstrap() {
  await AppDataSource.initialize();

  try {
    if (command === 'revert') {
      console.log('🔁 Reverting last migration...');
      await AppDataSource.undoLastMigration();
      console.log('✅ Last migration reverted.');
    } else {
      console.log('🚀 Running pending migrations...');
      await AppDataSource.runMigrations();
      console.log('✅ Migrations completed.');
    }
  } finally {
    await AppDataSource.destroy();
  }
}

bootstrap().catch((error) => {
  console.error('❌ Migration command failed:', error);
  process.exit(1);
});
