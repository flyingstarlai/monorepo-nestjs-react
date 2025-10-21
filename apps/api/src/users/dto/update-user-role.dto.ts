import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Admin', 'User'])
  roleName: string;
}
