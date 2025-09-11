import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BlogCreateModel,
  ImageType,
} from '../api/models/input/create-blog.input.model';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BlogEntity } from '../domain/blogs.entity';
import { UserEntity } from '../../users/domain/user.entity';
import { BanInfoForUserDto } from '../api/models/input/ban-user-for-blog.dto';
import { BlogBanEntity } from '../domain/blogBan.entity';
import { BlogBanInfoEntity } from '../domain/blogBanInfo.entity';
import { BlogBanBySuperEntity } from '../domain/blogBanBySuper.entity';
import { BanBlogBySuperDto } from '../api/models/input/ban-blog.input.dto';
import { ImageEntity } from '../domain/images.entity';
import { PhotoSizeViewModel } from '../api/models/output/photo-size.view.model';
import { PhotoSizeEntity } from '../domain/photoSize.entity';

@Injectable()
export class BlogsRepositoryTO {
  constructor(
    @InjectRepository(BlogEntity)
    private readonly bRepository: Repository<BlogEntity>,
    @InjectRepository(BlogBanEntity)
    private readonly banRepository: Repository<BlogBanEntity>,
    @InjectDataSource() public readonly dataSource: DataSource,
    // @InjectRepository(ImageEntity)
    // private readonly iRepository: Repository<ImageEntity>,
    @InjectRepository(PhotoSizeEntity)
    private readonly phRepository: Repository<PhotoSizeEntity>,
  ) {}

  async createBlog(blogData: BlogCreateModel, user?: UserEntity) {
    const blog = new BlogEntity();
    blog.name = blogData.name;
    blog.description = blogData.description;
    blog.websiteUrl = blogData.websiteUrl;
    if (user) {
      blog.user = user;
    }
    blog.images = new ImageEntity();
    blog.banInfo = new BlogBanBySuperEntity();
    const newBlog = await this.bRepository.save(blog);
    return newBlog.id;
  }

  async findBlogById(id: string) {
    const findedBlog = await this.bRepository.findOne({
      where: { id },
      relations: ['banInfo'],
    });
    if (!findedBlog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
    return findedBlog;
  }

  async updateBlogById(id: string, dto: BlogCreateModel) {
    const findedBlog = await this.findBlogById(id);
    if (findedBlog) {
      findedBlog.name = dto.name;
      findedBlog.description = dto.description;
      findedBlog.websiteUrl = dto.websiteUrl;
      await this.bRepository.manager.save(findedBlog);
    }
    return findedBlog;
  }

  async bindUserAsOwnToBlog(blog: BlogEntity, user: UserEntity) {
    blog.user = user;
    return await this.bRepository.manager.save(blog);
  }

  async deleteBlog(id: string) {
    const findedBlog = await this.findBlogById(id);
    return await this.bRepository.delete({ id });
  }

  // --------------------- USERS-BAN ------------------------ //

  async banUserForBlog(dto: BanInfoForUserDto, user: UserEntity) {
    const ifBlogExist = await this.bRepository.findOne({
      where: { id: dto.blogId },
    });
    if (!ifBlogExist)
      throw new NotFoundException(`Blog with id ${dto.blogId} not found`);
    if (dto.isBanned) {
      const isBanExist = await this.banRepository.findOne({
        where: { userId: user.id, blogId: dto.blogId },
      });

      if (!isBanExist) {
        const ban = new BlogBanEntity();
        ban.blogId = dto.blogId;
        ban.userId = user.id;
        ban.banStatus = true;
        const newBan = await this.banRepository.save(ban);
        const banInfo = new BlogBanInfoEntity();
        banInfo.isBanned = dto.isBanned;
        banInfo.banReason = dto.banReason;
        banInfo.blogBanId = newBan.id;
        await this.banRepository.manager.save(banInfo);
      }
    } else {
      const isBanExist = await this.banRepository.findOne({
        where: { userId: user.id, blogId: dto.blogId },
      });
      if (!isBanExist) {
        const ban = new BlogBanEntity();
        ban.blogId = dto.blogId;
        ban.userId = user.id;
        ban.banStatus = false;
        const newBan = await this.banRepository.save(ban);
        const banInfo = new BlogBanInfoEntity();
        banInfo.isBanned = dto.isBanned;
        banInfo.banReason = dto.banReason;
        banInfo.blogBanId = newBan.id;
        await this.banRepository.manager.save(banInfo);
      } else {
        isBanExist.banStatus = false;
        await this.banRepository.save(isBanExist);
      }
    }
    return;
  }

  async getUsersForCurrentBlog(blogId: string) {
    const bannedItems = await this.banRepository.find({
      where: { blogId },
      relations: ['user', 'blogBanInfo'],
    });
    return bannedItems.map((item) => {
      const { blogBanId, ...rest } = item.blogBanInfo;
      return {
        id: item.user.id.toString(),
        login: item.user.login,
        banInfo: rest,
      };
    });
  }

  async checkUserInBL(userId: string, blogId: string) {
    const bannedItems = await this.banRepository.find({
      where: {
        userId,
        blogId,
        banStatus: true,
      },
    });
    return bannedItems;
  }

  async banBlogBySuperUser(blogId: string, banInfoDto: BanBlogBySuperDto) {
    const findedBlog = await this.findBlogById(blogId);
    findedBlog.banInfo.isBanned = banInfoDto.isBanned;
    findedBlog.banInfo.banDate = new Date(Date.now()).toISOString();
    return await this.bRepository.save(findedBlog);
  }

  // ----------------------_IMAGES_------------------------- //

  async addWallpaperImageToBlog(blog: BlogEntity, dto: PhotoSizeViewModel) {
    const isWallpaperExist = await this.phRepository.findOne({
      where: {
        imageId: blog.images.id,
        imageType: ImageType.WALLPAPER,
      },
    });
    if (!isWallpaperExist) {
      const phSize = new PhotoSizeEntity();
      phSize.height = dto.height!;
      phSize.width = dto.width!;
      phSize.fileSize = dto.fileSize!;
      phSize.url = dto.url;
      phSize.imageId = blog.images.id;
      phSize.imageType = ImageType.WALLPAPER;
      blog.images.photoMetadata.push(phSize);
      await this.phRepository.save(phSize);
    } else {
      isWallpaperExist.height = dto.height!;
      isWallpaperExist.width = dto.width!;
      isWallpaperExist.fileSize = dto.fileSize!;
      isWallpaperExist.url = dto.url;
      await this.phRepository.save(isWallpaperExist);
    }
    const updatedBlog = await this.findBlogById(blog.id);
    return updatedBlog;
  }

  async addMainImageToBlog(blog: BlogEntity, dto: PhotoSizeViewModel, postId?: string) {
    const phSize = new PhotoSizeEntity();
    phSize.height = dto.height!;
    phSize.width = dto.width!;
    phSize.fileSize = dto.fileSize!;
    phSize.url = dto.url;
    if (postId) {
      phSize.postId = postId;
    }
    phSize.imageId = blog.images.id;
    await this.phRepository.save(phSize);
    const updatedBlog = await this.findBlogById(blog.id);
    return updatedBlog;
  }
}
