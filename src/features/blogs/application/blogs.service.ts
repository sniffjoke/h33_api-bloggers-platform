import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BlogsRepositoryTO } from '../infrastructure/blogs.repository.to';
import { BanInfoForUserDto } from '../api/models/input/ban-user-for-blog.dto';
import { UsersService } from '../../users/application/users.service';
import { BanBlogBySuperDto } from '../api/models/input/ban-blog.input.dto';

@Injectable()
export class BlogsService {

  constructor(
    private readonly blogsRepository: BlogsRepositoryTO,
    private readonly usersService: UsersService
  ) {
  }

  async banUserForBlog(bearerHeader: string, dto: BanInfoForUserDto, userId: string) {
    const curUser = await this.usersService.getUserByAuthToken(bearerHeader);
    const blog = await this.blogsRepository.findBlogById(dto.blogId)
    if (curUser.id !== blog.userId) throw new ForbiddenException('Not match');
    const user = await this.usersService.findUserById(userId);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return await this.blogsRepository.banUserForBlog(dto, user)
  }

  async getBannedUsers(bearerHeader: string, blogId: string) {
    const curUser = await this.usersService.getUserByAuthToken(bearerHeader);
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) throw new NotFoundException(`Blog with id ${blogId} not found`);
    if (curUser.id !== blog.userId) throw new ForbiddenException('Not match');
    const users = await this.blogsRepository.getUsersForCurrentBlog(blogId)
    // console.log('users: ', users);
    return {
      pagesCount: 0,
      page: 0,
      pageSize: 0,
      totalCount: 0,
      items: users
    }
  }

  async banBlogBySuperUser(blogId: string, dto: BanBlogBySuperDto) {
    return await this.blogsRepository.banBlogBySuperUser(blogId, dto)
  }

}
