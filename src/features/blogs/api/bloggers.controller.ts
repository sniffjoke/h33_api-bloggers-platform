import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BlogCreateModel } from './models/input/create-blog.input.model';
import { PostCreateModelWithParams } from '../../posts/api/models/input/create-post.input.model';
import { PostsService } from '../../posts/application/posts.service';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/useCases/create-blog.use-case';
import { UpdateBlogCommand } from '../application/useCases/update-blog.use-case';
import { DeleteBlogCommand } from '../application/useCases/delete-blog.use-case';
import { UpdatePostWithBlogInParamsCommand } from '../../posts/application/useCases/update-post-from-blogs-in-params.use-case';
import { DeletePostWithBlogInParamsCommand } from '../../posts/application/useCases/delete-post-from-blogs-in-params.use-case';
import { CreatePostCommand } from '../../posts/application/useCases/create-post.use-case';
import { BlogsQueryRepositoryTO } from '../infrastructure/blogs.query-repository.to';
import { PostsQueryRepositoryTO } from '../../posts/infrastructure/posts.query-repository.to';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { UsersService } from '../../users/application/users.service';
import { BlogsService } from '../application/blogs.service';
import { BanInfoForUserDto } from './models/input/ban-user-for-blog.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { LightsailStorageService } from '../../../core/settings/lightsail-storage.service';
import sharp from 'sharp';
import { PhotoSizeViewModel } from './models/output/photo-size.view.model';

@Controller('blogger')
export class BloggersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepositoryTO,
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepositoryTO,
    private readonly usersService: UsersService,
    private readonly blogsService: BlogsService,
    private readonly storage: LightsailStorageService,
  ) {}

  // TODO: метод execute pattern (service)

  @Post('blogs')
  @UseGuards(JwtAuthGuard)
  async createBlog(@Body() dto: BlogCreateModel, @Req() req: Request) {
    const blogId = await this.commandBus.execute(
      new CreateBlogCommand(dto, req.headers.authorization as string),
    );
    const newBlog = await this.blogsQueryRepository.blogOutput(blogId);
    return newBlog;
  }

  @Get('blogs') //-1
  @UseGuards(JwtAuthGuard)
  async getAll(@Query() query: any, @Req() req: Request) {
    const user = await this.usersService.getUserByAuthToken(
      req.headers.authorization as string,
    );
    const blogsWithQuery = await this.blogsQueryRepository.getAllBlogsWithQuery(
      query,
      false,
      user.id,
    );
    return blogsWithQuery;
  }

  @Put('blogs/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async updateBlogById(
    @Param('id') id: string,
    @Body() dto: BlogCreateModel,
    @Req() req: Request,
  ) {
    const updateBlog = await this.commandBus.execute(
      new UpdateBlogCommand(id, dto, req.headers.authorization as string),
    );
    return updateBlog;
  }

  @Delete('blogs/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async deleteBlog(@Param('id') id: string, @Req() req: Request) {
    const deleteBlog = await this.commandBus.execute(
      new DeleteBlogCommand(id, req.headers.authorization as string),
    );
    return deleteBlog;
  }

  // --------------------- posts ------------------------ //

  @Get('blogs/:id/posts')
  @UseGuards(JwtAuthGuard)
  async getAllPostsByBlogId(
    @Param('id') id: string,
    @Query() query: any,
    @Req() req: Request,
  ) {
    const posts = await this.postsQueryRepository.getAllPostsWithQuery(
      query,
      id,
    );
    const newData = await this.postsService.generatePostsWithLikesDetails(
      posts.items,
      req.headers.authorization as string,
    );
    return {
      ...posts,
      items: newData,
    };
  }

  @Post('blogs/:id/posts')
  @UseGuards(JwtAuthGuard)
  async createPostWithParams(
    @Body() dto: PostCreateModelWithParams,
    @Param('id') blogId: string,
    @Req() req: Request,
  ) {
    const postId = await this.commandBus.execute(
      new CreatePostCommand(
        {
          ...dto,
          blogId,
        },
        req.headers.authorization as string,
      ),
    );
    const newPost = await this.postsQueryRepository.postOutput(postId);
    const postWithDetails =
      await this.postsService.generateOnePostWithLikesDetails(
        newPost,
        req.headers.authorization as string,
      );
    return postWithDetails;
  }

  @Put('blogs/:blogId/posts/:postId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Body() dto: PostCreateModelWithParams,
    @Param() idParams: any,
    @Req() req: Request,
  ) {
    const updatePost = await this.commandBus.execute(
      new UpdatePostWithBlogInParamsCommand(
        idParams.postId,
        idParams.blogId,
        dto,
        req.headers.authorization as string,
      ),
    );
    return updatePost;
  }

  @Delete('blogs/:blogId/posts/:postId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async deletePost(@Param() idParams: any, @Req() req: Request) {
    const deletePost = await this.commandBus.execute(
      new DeletePostWithBlogInParamsCommand(
        idParams.postId,
        idParams.blogId,
        req.headers.authorization as string,
      ),
    );
    return deletePost;
  }

  // --------------------- USERS-BAN ------------------------ //

  @Put('users/:id/ban')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async banUserForBlog(
    @Param('id') id: string,
    @Body() dto: BanInfoForUserDto,
    @Req() req: Request,
  ) {
    await this.blogsService.banUserForBlog(
      req.headers.authorization as string,
      dto,
      id,
    );
  }

  @Get('users/blog/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getBannedUsersForBlog(
    @Param('id') id: string,
    @Query() query: any,
    @Req() req: Request,
  ) {
    const items =
      await this.blogsQueryRepository.getAllBannedUsersForCurrentBlog(
        query,
        id,
      );
    const users = await this.blogsService.getBannedUsers(
      req.headers.authorization as string,
      id,
    );
    return items;
  }

  // ----------------------_IMAGES_------------------------- //

  @Post('blogs/:blogId/images/wallpaper')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addBlogWallpaperImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('blogId') blogId: string,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Файл обязателен');
    }
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
      'image/avif',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Неподдерживаемый формат: ${file.mimetype}`,
      );
    }
    const image = await sharp(file.buffer);
    const metadata = await image.metadata();
    if (metadata.height !== 312 || metadata.width !== 1028) {
      throw new BadRequestException('Width|and|height must be as 1028x312');
    }
    const url = await this.storage.uploadFile(
      `blogs/wallpaper/${Date.now()}-${file.originalname}`,
      file.buffer,
      file.mimetype,
    );
    const buffer = file.buffer;
    const fileSizeKb = Math.round(buffer.length / 1024);

    if (fileSizeKb > 100) {
      throw new BadRequestException(
        `File is too much: ${fileSizeKb} Kb. Max 100 Kb.`,
      );
    }

    const imageModel: PhotoSizeViewModel = {
      url,
      width: metadata.width,
      height: metadata.height,
      fileSize: buffer.length,
    };
    const blog = await this.blogsService.addWallpaperImage(
      blogId,
      imageModel,
      req.headers.authorization as string,
    );
    return await this.blogsQueryRepository.getPhotoMetadata(blog!.id);
  }

  @Post('blogs/:blogId/images/main')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addBlogMainImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('blogId') blogId: string,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Файл обязателен');
    }
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
      'image/avif',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Неподдерживаемый формат: ${file.mimetype}`,
      );
    }
    const image = await sharp(file.buffer);
    const metadata = await image.metadata();
    if (metadata.height !== 156 || metadata.width !== 156) {
      throw new BadRequestException('Width|and|height must be as 156x156');
    }
    const url = await this.storage.uploadFile(
      `blogs/main/${Date.now()}-${file.originalname}`,
      file.buffer,
      file.mimetype,
    );
    const buffer = file.buffer;
    const fileSizeKb = Math.round(buffer.length / 1024);

    if (fileSizeKb > 100) {
      throw new BadRequestException(
        `File is too much: ${fileSizeKb} Kb. Max 100 Kb.`,
      );
    }
    const imageModel: PhotoSizeViewModel = {
      url,
      width: metadata.width,
      height: metadata.height,
      fileSize: buffer.length,
    };
    const blog = await this.blogsService.addMainImage(
      blogId,
      imageModel,
      req.headers.authorization as string,
    );

    const output = await this.blogsQueryRepository.getPhotoMetadata(blog!.id);
    return {
      main: output.main,
      wallpaper: output.wallpaper,
    };
  }

  @Post('blogs/:blogId/posts/:postId/images/main')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addPostMainImage(
    @UploadedFile() file: Express.Multer.File,
    @Param() idParams: any,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Файл обязателен');
    }
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
      'image/avif',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Неподдерживаемый формат: ${file.mimetype}`,
      );
    }
    const image = await sharp(file.buffer);
    const metadata = await image.metadata();

    const allowedSizes = new Set([
      '940x432',
      //   '300x180',
      //   '149x96',
    ]);
    const sizeKey = `${metadata.width}x${metadata.height}`;
    if (!allowedSizes.has(sizeKey)) {
      throw new BadRequestException('Invalid image size');
    }

    const url = await this.storage.uploadFile(
      `posts/main/${Date.now()}-${file.originalname}`,
      file.buffer,
      file.mimetype,
    );
    const buffer = file.buffer;
    const fileSizeKb = Math.round(buffer.length / 1024);

    if (fileSizeKb > 100) {
      throw new BadRequestException(
        `File is too much: ${fileSizeKb} Kb. Max 100 Kb.`,
      );
    }
    const images = await this.postsService.generateResizedImages(file);
    const uploadResizedImages = await Promise.all(images.map(async image => {
      return await this.storage.uploadFile(
        `posts/main/resize-${image.width}x${image.height}-${file.originalname}`,
        image.buffer,
        file.mimetype,
      );
    }))
    // console.log('upload resized: ', uploadResizedImages);
    const imageModel: Omit<PhotoSizeViewModel, 'url'> = {
      // url,
      width: metadata.width,
      height: metadata.height,
      fileSize: buffer.length
    }
    const addCroppedImagesToDB = await this.postsService.addMainImageForPost(
      idParams.blogId,
      idParams.postId,
      [...uploadResizedImages, url],
      req.headers.authorization as string,
      [...images, imageModel],
    );
    // console.log('posts: ', posts);
    // const imagesOutput = await Promise.all(createThreeImages!.map(async post => {
    const main = await this.postsQueryRepository.getPhotoMetadata(
      idParams.postId,
    );
    return { main };
    // }))
    // console.log('imagesOutput: ', imagesOutput);
    // return imagesOutput
  }
}
