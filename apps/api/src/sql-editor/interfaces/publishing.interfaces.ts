import { ValidationIssue } from './validation.interfaces';

export interface PublishContext {
  workspaceId: string;
  procedureId: string;
  userId?: string;
}

export interface PublishStep {
  name: string;
  execute(context: PublishContext, sql: string): Promise<PublishResult>;
}

export interface PublishResult {
  success: boolean;
  issues?: ValidationIssue[];
  sqlPreview?: string;
  duration?: number;
}

export interface PrecheckResult extends PublishResult {
  canProceed: boolean;
}

export interface DeployResult extends PublishResult {
  deployedName?: string;
}

export interface VerifyResult extends PublishResult {
  verified: boolean;
  objectDefinition?: string;
}

export interface IPublisher {
  precheck(context: PublishContext, sql: string): Promise<PrecheckResult>;
  deploy(context: PublishContext, sql: string): Promise<DeployResult>;
  verify(context: PublishContext, procedureName: string): Promise<VerifyResult>;
}