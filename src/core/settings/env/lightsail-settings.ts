import { IsString } from "class-validator";
import { EnvironmentVariable } from "./configuration";

export class LightsailSettings {
  constructor(private environmentVariables: EnvironmentVariable) {}
  @IsString()
  LIGHTSAIL_ENDPOINT=this.environmentVariables.LIGHTSAIL_ENDPOINT;
  @IsString()
  LIGHTSAIL_BUCKET=this.environmentVariables.LIGHTSAIL_BUCKET;
  @IsString()
  LIGHTSAIL_ACCESS_KEY_ID=this.environmentVariables.LIGHTSAIL_ACCESS_KEY_ID;
  @IsString()
  LIGHTSAIL_SECRET_ACCESS_KEY=this.environmentVariables.LIGHTSAIL_SECRET_ACCESS_KEY;
  @IsString()
  LIGHTSAIL_REGION=this.environmentVariables.LIGHTSAIL_REGION;
}
