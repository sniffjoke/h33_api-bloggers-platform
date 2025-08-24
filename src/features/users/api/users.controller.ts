import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  Query, Put,
} from '@nestjs/common';
import { CreateUserDto } from './models/input/create-user.dto';
import { BasicAuthGuard } from '../../../core/guards/basic-auth.guard';
import { CreateUserCommand } from '../application/useCases/create-user.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../application/useCases/delete-user.use-case';
import { UsersQueryRepositoryTO } from '../infrastructure/users.query-repositories.to';
import { BanUserDto } from './models/input/ban-user.dto';
import { BanUserCommand } from '../application/useCases/ban-user.use-case';

@Controller('sa')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly usersQueryRepository: UsersQueryRepositoryTO,
  ) {}

  @Post('users')
  @UseGuards(BasicAuthGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    const userId = await this.commandBus.execute(
      new CreateUserCommand({ ...createUserDto }, true),
    );
    return await this.usersQueryRepository.userOutput(userId);
  }

  @Get('users')
  @UseGuards(BasicAuthGuard)
  async findAll(@Query() query: any) {
    return await this.usersQueryRepository.getAllUsersWithQuery(query);
  }

  @Delete('users/:id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  remove(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }

  @Put('users/:id/ban')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async banUser(@Param('id') id: string, @Body() banUserDto: BanUserDto) {
    await this.commandBus.execute(new BanUserCommand(id, banUserDto));
  }
}
