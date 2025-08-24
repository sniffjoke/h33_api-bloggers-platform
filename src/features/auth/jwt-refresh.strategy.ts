import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../core/settings/env/configuration';


@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService<ConfigurationType, true>,
  ) {
    const apiSettings = configService.get('apiSettings', {
      infer: true,
    });
    super({
      jwtFromRequest: ExtractJwt.fromExtractors(
        [
          (req) => {
            if (req && req.cookies) {
              return req.cookies['refresh_token'];
            }
            return null;
          },
        ]
      ),
      ignoreExpiration: false,
      secretOrKey: apiSettings.JWT_SECRET_REFRESH_TOKEN
    });
  }

  async validate(payload: any) {
    return {userId: payload._id, deviceId: payload.deviceId};
  }

}
