import 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'TCS',
  synchronize: false,
  logging: false,
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: true,
  },
});

async function dropAllTables() {
  await dataSource.initialize();
  console.log('Connected to database');

  try {
    console.log('Dropping all tables...');
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
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
  }

  await dataSource.destroy();
}

dropAllTables().catch(console.error);
