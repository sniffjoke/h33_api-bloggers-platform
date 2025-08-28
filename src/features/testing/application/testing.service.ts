import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TestingService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async deleteAll() {
    const entities = this.dataSource.entityMetadatas;

    try {
      for (const entity of entities) {
        const repository = this.dataSource.getRepository(entity.name);
        // В PostgreSQL TRUNCATE требует кавычек для названий с большой буквы
        await repository.query(
          `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
        );
      }
    } catch (error) {
      throw new Error(`FAILED to truncate tables: ${error}`);
    }

    // return await this.dataSource.query(
    // `
    //         TRUNCATE TABLE answer RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE question RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE "playerProgress" RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE "gamePair" RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE likes RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE comments RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE posts RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE devices RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE tokens RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE blogs RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE "userScore" RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE users RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE "blogBan" RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE "blogBanBySuper" RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE "blogBanInfo" RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE images RESTART IDENTITY CASCADE;
    //         TRUNCATE TABLE "photoSizes" RESTART IDENTITY CASCADE;
    // `
    // ,

    // );
  }
}
