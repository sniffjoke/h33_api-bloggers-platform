import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PaginationBaseModel } from '../../../core/base/pagination.base.model';
import { UserEntity } from '../domain/user.entity';
import { BanStatusDto } from '../api/models/input/ban-user.dto';


@Injectable()
export class UsersQueryRepositoryTO {
  constructor(
    @InjectRepository(UserEntity) private readonly uRepository: Repository<UserEntity>
  ) {
  }

  async userOutput(id: string) {
    const findedUser = await this.uRepository.findOne(
      {
        where: { id },
        relations: ['banInfo'],
      },
    );
    if (!findedUser) {
      throw new NotFoundException('User not found');
    }
    return this.userMap(findedUser);
  }

  userMap(user: UserEntity) {
    const { email, login, createdAt, id, banInfo } = user;
    const { userId, ...banInfoWithoutUserId } = banInfo;
    return {
      id: id.toString(),
      login,
      email,
      createdAt,
      banInfo: banInfoWithoutUserId,
    };
  }

  async getAllUsersWithQuery(query: any) {
    const generateQuery = await this.generateQuery(query);
    // const items = await this.uRepository
    //   .find({
    //     where: [
    //       { email: Or(ILike(`${generateQuery.searchEmailTerm}`)) },
    //       { login: Or(ILike(`${generateQuery.searchLoginTerm}`)) },
    //     ],
    //     relations: ['banInfo'],
    //     order: {
    //       [generateQuery.sortBy]: generateQuery.sortDirection,
    //     },
    //     take: generateQuery.pageSize,
    //     skip: (generateQuery.page - 1) * generateQuery.pageSize,
    //   });
    console.log(generateQuery.banStatus);
    const items = this.uRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.banInfo', 'b')
      // .where('LOWER(u.email) LIKE LOWER(:email)', { email: `%${generateQuery.searchEmailTerm}%` })
      // .orWhere('LOWER(u.login) LIKE LOWER(:login)', { login: `%${generateQuery.searchLoginTerm}%` })
      .where(new Brackets(qb => {
        qb.where('LOWER(u.email) LIKE LOWER(:email)', { email: `%${generateQuery.searchEmailTerm}%` })
          .orWhere('LOWER(u.login) LIKE LOWER(:login)', { login: `%${generateQuery.searchLoginTerm}%` });
      }))
      .orderBy(`u.${generateQuery.sortBy}`, generateQuery.sortDirection.toUpperCase())
      .skip((generateQuery.page - 1) * generateQuery.pageSize)
      .take(generateQuery.pageSize);
    if (generateQuery.banStatus === BanStatusDto.Banned) {
      items.andWhere('b.isBanned = :status', { status: true });
    } else if (generateQuery.banStatus === BanStatusDto.NotBanned) {
      items.andWhere('b.isBanned = :status', { status: false });
    }
    const itemsWithQuery = await items.getMany()
    const itemsOutput = itemsWithQuery.map((item: any) => this.userMap(item));
    const resultPosts = new PaginationBaseModel(generateQuery, itemsOutput);
    return resultPosts;
  }

  private async generateQuery(query: any) {
    const searchLoginTerm = query.searchLoginTerm ? query.searchLoginTerm : '';
    const searchEmailTerm = query.searchEmailTerm ? query.searchEmailTerm : '';
    // const totalCount = await this.uRepository.count(
    //   {
    //     where: [
    //       { email: Or(ILike(`%${searchEmailTerm}%`)) },
    //       { login: Or(ILike(`%${searchLoginTerm}%`)) },
    //     ],
    //   },
    // );
    const items = this.uRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.banInfo', 'b')
      // .where('LOWER(u.email) LIKE LOWER(:email)', { email: `%${generateQuery.searchEmailTerm}%` })
      // .orWhere('LOWER(u.login) LIKE LOWER(:login)', { login: `%${generateQuery.searchLoginTerm}%` })
      .where(new Brackets(qb => {
        qb.where('LOWER(u.email) LIKE LOWER(:email)', { email: `%${searchEmailTerm}%` })
          .orWhere('LOWER(u.login) LIKE LOWER(:login)', { login: `%${searchLoginTerm}%` });
      }))
    if (query.banStatus === BanStatusDto.Banned) {
      items.andWhere('b.isBanned = :status', { status: true });
    } else if (query.banStatus === BanStatusDto.NotBanned) {
      items.andWhere('b.isBanned = :status', { status: false });
    }
    const totalCount = await items.getCount()
    const pageSize = query.pageSize ? +query.pageSize : 10;
    const pagesCount = Math.ceil(Number(totalCount) / pageSize);
    return {
      totalCount: Number(totalCount),
      pageSize,
      pagesCount,
      page: query.pageNumber ? Number(query.pageNumber) : 1,
      sortBy: query.sortBy ? query.sortBy : 'createdAt',
      sortDirection: query.sortDirection ? query.sortDirection : 'desc',
      searchLoginTerm: `%` + searchLoginTerm + '%',
      searchEmailTerm: '%' + searchEmailTerm + '%',
      banStatus: query.banStatus ? query.banStatus : BanStatusDto.All,
    };
  }

}
