// import { PartialType } from '@nestjs/mapped-types';
// import { CreateUserDto } from './create-user.models';
//
// export class UpdateUserDto extends PartialType(CreateUserDto) {}

import { Trim } from '../../../../../core/decorators/transform/trim';
import { IsString, Length } from 'class-validator';

export class BanUserDto {
  isBanned: boolean;

  // @Trim()
  @IsString({message: 'Должно быть строковым значением'})
  @Length(20, 1000, {message: 'Минимум знаков: 20'})
  banReason: string | null;
}

export class BanInfoDto extends BanUserDto {
  banDate: string | null;
}

export enum BanStatusDto {
  Banned = 'banned',
  All = 'all',
  NotBanned = 'notBanned',
}