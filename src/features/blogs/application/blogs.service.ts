import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogsRepositoryTO } from '../infrastructure/blogs.repository.to';
import { BanInfoForUserDto } from '../api/models/input/ban-user-for-blog.dto';
import { UsersService } from '../../users/application/users.service';
import { BanBlogBySuperDto } from '../api/models/input/ban-blog.input.dto';
import { PhotoSizeViewModel } from '../api/models/output/photo-size.view.model';
import { UsersCheckHandler } from '../../users/domain/users.check-handler';

@Injectable()
export class BlogsService {
  constructor(
    private readonly blogsRepository: BlogsRepositoryTO,
    private readonly usersService: UsersService,
    private readonly usersCheckHandler: UsersCheckHandler,
  ) {}

  async banUserForBlog(
    bearerHeader: string,
    dto: BanInfoForUserDto,
    userId: string,
  ) {
    const curUser = await this.usersService.getUserByAuthToken(bearerHeader);
    const blog = await this.blogsRepository.findBlogById(dto.blogId);
    if (curUser.id !== blog.userId) throw new ForbiddenException('Not match');
    const user = await this.usersService.findUserById(userId);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return await this.blogsRepository.banUserForBlog(dto, user);
  }

  async getBannedUsers(bearerHeader: string, blogId: string) {
    const curUser = await this.usersService.getUserByAuthToken(bearerHeader);
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) throw new NotFoundException(`Blog with id ${blogId} not found`);
    if (curUser.id !== blog.userId) throw new ForbiddenException('Not match');
    const users = await this.blogsRepository.getUsersForCurrentBlog(blogId);
    // console.log('users: ', users);
    return {
      pagesCount: 0,
      page: 0,
      pageSize: 0,
      totalCount: 0,
      items: users,
    };
  }

  async banBlogBySuperUser(blogId: string, dto: BanBlogBySuperDto) {
    return await this.blogsRepository.banBlogBySuperUser(blogId, dto);
  }

  async addWallpaperImage(
    blogId: string,
    dto: PhotoSizeViewModel,
    bearerHeader: string,
  ) {
    const findedBlog = await this.blogsRepository.findBlogById(blogId);
    const user = await this.usersService.getUserByAuthToken(bearerHeader);
    if (
      this.usersCheckHandler.checkIsOwner(
        Number(findedBlog.userId),
        Number(user.id),
      )
    ) {
      return await this.blogsRepository.addWallpaperImageToBlog(
        findedBlog,
        dto,
      );
    }
  }

  async addMainImage(
    blogId: string,
    dto: PhotoSizeViewModel,
    bearerHeader: string,
  ) {
    const findedBlog = await this.blogsRepository.findBlogById(blogId);
    const user = await this.usersService.getUserByAuthToken(bearerHeader);
    if (
      this.usersCheckHandler.checkIsOwner(
        Number(findedBlog.userId),
        Number(user.id),
      )
    ) {
      return await this.blogsRepository.addMainImageToBlog(findedBlog, dto);
    }
  }

}
