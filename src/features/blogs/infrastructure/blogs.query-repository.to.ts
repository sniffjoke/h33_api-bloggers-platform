import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogViewModel } from '../api/models/output/blog.view.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationBaseModel } from '../../../core/base/pagination.base.model';
import { BlogEntity } from '../domain/blogs.entity';
import { UserEntity } from '../../users/domain/user.entity';
import { BanUserForBlogViewModel } from '../api/models/output/ban-user-for-blog.view.dto';
import { BlogBanInfoEntity } from '../domain/blogBanInfo.entity';
import { BanBlogInfoViewModel } from '../api/models/output/ban-blog-info.view.model';

@Injectable()
export class BlogsQueryRepositoryTO {
  constructor(
    @InjectRepository(BlogEntity)
    private readonly bRepository: Repository<BlogEntity>,
    @InjectRepository(BlogBanInfoEntity)
    private readonly banInfoRepository: Repository<BlogBanInfoEntity>,
  ) {}

  async getAllBlogsWithQuery(
    query: any,
    getUsers?: boolean,
    userId?: string,
    banInfo?: boolean,
  ) {
    const generateQuery = await this.generateQuery(query, getUsers, userId, banInfo);
    const items = this.bRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.banInfo', 'i')
      .where('LOWER(b.name) LIKE LOWER(:name)', {
        name: generateQuery.searchNameTerm.toLowerCase(),
      })
      .orderBy(
        `b."${generateQuery.sortBy}"`,
        generateQuery.sortDirection.toUpperCase(),
      )
      .offset((generateQuery.page - 1) * generateQuery.pageSize)
      .limit(generateQuery.pageSize);
    if (!banInfo) {
      items.andWhere('i.isBanned = :is', { is: false });
    }
    if (getUsers) {
      items.leftJoinAndSelect('b.user', 'user');
    }
    if (userId) {
      items.andWhere('b.userId = :id', { id: userId });
    }
    const itemsWithQuery = await items.getMany();
    const itemsOutput = itemsWithQuery.map((item) =>
      banInfo
        ? this.blogOutputMap(item, item.user, item.banInfo)
        : this.blogOutputMap(item, item.user),
    );
    const resultBlogs = new PaginationBaseModel<BlogViewModel>(
      generateQuery,
      itemsOutput,
    );
    return resultBlogs;
  }

  private async generateQuery(
    query: any,
    getUsers?: boolean,
    userId?: string,
    banInfo?: boolean,
  ) {
    const searchNameTerm: string = query.searchNameTerm
      ? query.searchNameTerm
      : '';
    const totalCount = this.bRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.banInfo', 'i')
      .where('LOWER(b.name) LIKE LOWER(:name)', {
        name: `%${searchNameTerm.toLowerCase()}%`,
      });
    if (!banInfo) {
      totalCount.andWhere('i.isBanned = :is', { is: false });
    }
    if (getUsers) {
      totalCount.leftJoinAndSelect('b.user', 'user');
    }
    if (userId) {
      totalCount.andWhere('b.userId = :id', { id: userId });
    }
    const totalCountWithQuery = await totalCount.getCount();
    const pageSize = query.pageSize ? +query.pageSize : 10;
    const pagesCount = Math.ceil(totalCountWithQuery / pageSize);

    return {
      totalCount: totalCountWithQuery,
      pageSize,
      pagesCount,
      page: query.pageNumber ? Number(query.pageNumber) : 1,
      sortBy: query.sortBy ? query.sortBy : 'createdAt',
      sortDirection: query.sortDirection ? query.sortDirection : 'desc',
      searchNameTerm: '%' + searchNameTerm + '%',
    };
  }

  async blogOutput(id: string, user?: UserEntity) {
    const findedBlog = await this.bRepository.findOne({
      where: { id },
      relations: ['banInfo'],
    });
    if (!findedBlog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
    if (user) return this.blogOutputMap(findedBlog, user);
    if (findedBlog.banInfo.isBanned) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
    return this.blogOutputMap(findedBlog);
  }

  blogOutputMap(
    blog: BlogViewModel,
    user?: UserEntity,
    banInfo?: BanBlogInfoViewModel,
  ) {
    const { id, name, description, websiteUrl, isMembership, createdAt } = blog;
    const output: typeof blog = {
      id: id.toString(),
      name,
      description,
      websiteUrl,
      createdAt,
      isMembership,
    };

    if (user) {
      output.blogOwnerInfo = {
        userId: user.id.toString(),
        userLogin: user.login,
      };
    }

    if (banInfo) {
      output.banInfo = {
        isBanned: banInfo.isBanned,
        banDate: banInfo.banDate,
      };
    }

    return output;
  }

  // --------------------- USERS-BAN ------------------------ //

  async getAllBannedUsersForCurrentBlog(query: any, blogId: string) {
    const generateQueryBan = await this.generateQueryBan(query, blogId);
    const items = this.banInfoRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.blogBan', 'ban')
      .leftJoinAndSelect('ban.user', 'user')
      .where('LOWER(user.login) LIKE LOWER(:name)', {
        name: generateQueryBan.searchLoginTerm.toLowerCase(),
      })
      .andWhere('ban.blogId = :id', { id: blogId })
      .andWhere('ban.banStatus = :status', { status: true })
      .orderBy(
        `"${generateQueryBan.sortBy}"`,
        generateQueryBan.sortDirection.toUpperCase(),
      )
      .offset((generateQueryBan.page - 1) * generateQueryBan.pageSize)
      .limit(generateQueryBan.pageSize);
    const itemsWithQuery = await items.getMany();
    // return itemsWithQuery;
    const itemsOutput = itemsWithQuery.map((item) =>
      this.banUserOutputMap(item),
    );
    const resultBlogs = new PaginationBaseModel<BanUserForBlogViewModel>(
      generateQueryBan,
      itemsOutput,
    );
    return resultBlogs;
  }

  private async generateQueryBan(query: any, blogId: string) {
    const searchLoginTerm: string = query.searchLoginTerm
      ? query.searchLoginTerm
      : '';
    const totalCount = this.banInfoRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.blogBan', 'ban')
      .leftJoinAndSelect('ban.user', 'user')
      .where('LOWER(user.login) LIKE LOWER(:name)', {
        name: `%${searchLoginTerm.toLowerCase()}%`,
      })
      .andWhere('ban.blogId = :id', { id: blogId })
      .andWhere('ban.banStatus = :status', { status: true });
    const totalCountWithQuery = await totalCount.getCount();
    const pageSize = query.pageSize ? +query.pageSize : 10;
    const pagesCount = Math.ceil(totalCountWithQuery / pageSize);

    return {
      totalCount: totalCountWithQuery,
      pageSize,
      pagesCount,
      page: query.pageNumber ? Number(query.pageNumber) : 1,
      sortBy: query.sortBy ? query.sortBy : 'createdAt',
      sortDirection: query.sortDirection ? query.sortDirection : 'desc',
      searchLoginTerm: '%' + searchLoginTerm + '%',
    };
  }

  banUserOutputMap(item: BlogBanInfoEntity): BanUserForBlogViewModel {
    const { isBanned, blogBan, banReason, banDate } = item;
    // const output: typeof blog = {
    const output = {
      id: blogBan.userId.toString(),
      login: blogBan.user.login,
      banInfo: {
        isBanned,
        banDate,
        banReason,
      },
    };

    return output;
  }
}
