import { IsOptional, IsString } from 'class-validator';
import { ActivityType } from '../entities/activity.entity';

export class ActivityDto {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: string;
}

export class ActivitiesQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ActivitiesResponseDto {
  items: ActivityDto[];
  nextCursor?: string;
  pagination?: PaginationDto;
}
