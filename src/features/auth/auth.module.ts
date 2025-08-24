import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensModule } from '../tokens/tokens.module';
import { DevicesModule } from '../devices/devices.module';
import { AuthCommandHandlers } from './application/useCases';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { AuthService } from './application/auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    DevicesModule,
    TokensModule,
    UsersModule,
    TypeOrmModule.forFeature([]),
  ],
  controllers: [AuthController],
  providers: [...AuthCommandHandlers, AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {
}
