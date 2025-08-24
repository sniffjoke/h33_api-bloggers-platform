import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigurationType } from './env/configuration';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class LightsailStorageService {
  private readonly s3: S3Client
  private readonly bucket: string

  constructor(
    private readonly configService: ConfigService<ConfigurationType, true>
  ) {
    this.bucket = this.configService.get('lightsailSettings', {infer: true}).LIGHTSAIL_BUCKET;

    this.s3 = new S3Client({
      region: this.configService.get('lightsailSettings', {infer: true}).LIGHTSAIL_REGION,
      endpoint: this.configService.get('lightsailSettings', {infer: true}).LIGHTSAIL_ENDPOINT,
      credentials: {
        accessKeyId: this.configService.get('lightsailSettings', {infer: true}).LIGHTSAIL_ACCESS_KEY_ID,
        secretAccessKey: this.configService.get('lightsailSettings', {infer: true}).LIGHTSAIL_SECRET_ACCESS_KEY
      }
    })
  }

  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    const lightsailSettings = this.configService.get('lightsailSettings', {
      infer: true,
    });
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3.send(command)

    return `${lightsailSettings.LIGHTSAIL_ENDPOINT}/${this.bucket}/${key}`
  }

}
