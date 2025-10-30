import { Injectable } from '@nestjs/common';
import { IMssqlClient } from '../interfaces/validation.interfaces';
import { MssqlConnectionRegistry } from '../services/mssql-connection-registry.service';

@Injectable()
export class MssqlClientService implements IMssqlClient {
  constructor(private readonly connectionRegistry: MssqlConnectionRegistry) {}

  async query(sql: string, workspaceId: string): Promise<any> {
    const dataSource = await this.connectionRegistry.getConnectionForWorkspace(workspaceId);
    return dataSource.query(sql);
  }

  async executeBatch(sql: string[], workspaceId: string): Promise<any[]> {
    const dataSource = await this.connectionRegistry.getConnectionForWorkspace(workspaceId);
    const results: any[] = [];
    
    for (const batchSql of sql) {
      const result = await dataSource.query(batchSql);
      results.push(result);
    }
    
    return results;
  }
}