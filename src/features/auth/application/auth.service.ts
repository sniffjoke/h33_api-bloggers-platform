import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersRepositoryTO } from '../../users/infrastructure/users.repository.to';
import { CryptoService } from '../../../core/modules/crypto/application/crypto.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepositoryTO,
    private readonly cryptoService: CryptoService,
  ) {}

  async validateUser(loginOrEmail: string, password: string) {
    const findedUser = await this.usersRepository.findUserByLogin(loginOrEmail);
    const comparePass = await this.cryptoService.comparePassword(
      password,
      findedUser.password,
    );
    if (comparePass) {
      const { password, ...result } = findedUser;
      return result;
    }
    throw new UnauthorizedException('Password not match');
  }
}
