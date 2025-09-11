import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostViewModel } from '../api/models/output/post.view.model';
import { PaginationBaseModel } from '../../../core/base/pagination.base.model';
import { PostEntity } from '../domain/posts.entity';
import { BlogEntity } from '../../blogs/domain/blogs.entity';
import { PhotoSizeEntity } from '../../blogs/domain/photoSize.entity';
import { ImageType } from '../../blogs/api/models/input/create-blog.input.model';

@Injectable()
export class PostsQueryRepositoryTO {
  constructor(
    @InjectRepository(PostEntity)
    private readonly pRepository: Repository<PostEntity>,
    @InjectRepository(BlogEntity)
    private readonly bRepository: Repository<BlogEntity>,
    @InjectRepository(PhotoSizeEntity)
    private readonly phRepository: Repository<PhotoSizeEntity>,
  ) {}

  async getAllPostsWithQuery(query: any, blogId?: string) {
    const generateQuery = await this.generateQuery(query, blogId);
    if (blogId) {
      const findedBlog = await this.bRepository.findOne({
        where: { id: blogId },
      });
      if (!findedBlog) {
        throw new NotFoundException(`Blog with id ${blogId} not found`);
      }
    }

    const itemsRaw = blogId
      ? await this.pRepository
          .createQueryBuilder('p')
          .innerJoin('extendedLikesInfo', 'e', 'e."postId" = p."id"')
          .leftJoin('images', 'i', 'i."id" = p."imagesId"')
          .select([
            'p."id"',
            'p."title"',
            'p."shortDescription"',
            'p."content"',
            'p."blogId"',
            'p."blogName"',
            'p."createdAt"',
            'e."likesCount"',
            'e."dislikesCount"',
            'p."imagesId"',
          ])
          .where('p.blogId = :blogId', { blogId })
          .orderBy(
            `"${generateQuery.sortBy}"`,
            generateQuery.sortDirection.toUpperCase(),
          )
          .offset((generateQuery.page - 1) * generateQuery.pageSize)
          .limit(generateQuery.pageSize)
          .getRawMany()
      : await this.pRepository
          .createQueryBuilder('p')
          .innerJoin('extendedLikesInfo', 'e', 'e."postId" = p."id"')
          .select([
            'p."id"',
            'p."title"',
            'p."shortDescription"',
            'p."content"',
            'p."blogId"',
            'p."blogName"',
            'p."createdAt"',
            'e."likesCount"',
            'e."dislikesCount"',
          ])
          .orderBy(
            `"${generateQuery.sortBy}"`,
            generateQuery.sortDirection.toUpperCase(),
          )
          .offset((generateQuery.page - 1) * generateQuery.pageSize)
          .limit(generateQuery.pageSize)
          .getRawMany();
    const items = itemsRaw.map((post) => {
      return {
        id: post.id,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId,
        blogName: post.blogName,
        createdAt: post.createdAt,
        extendedLikesInfo: {
          likesCount: post.likesCount,
          dislikesCount: post.dislikesCount,
        },
        imagesId: post.imagesId,
      };
    });

    const itemsOutput = await Promise.all(
      items.map(async (item) => {
        const photoMetadata = await this.phRepository.find({
          // where: { imageId: item.imagesId },
          where: { postId: item.id },
        });
        console.log('photoMetadata: ', photoMetadata);
        return this.postOutputMap(item, photoMetadata);
      }),
    );
    const resultPosts = new PaginationBaseModel<PostViewModel>(
      generateQuery,
      itemsOutput,
    );
    return resultPosts;
  }

  private async generateQuery(query: any, blogId?: string) {
    const totalCount = blogId
      ? await this.pRepository
          .createQueryBuilder('p')
          .where('p.blogId = :blogId', { blogId })
          .getCount()
      : await this.pRepository.createQueryBuilder('p').getCount();
    const pageSize = query.pageSize ? +query.pageSize : 10;
    const pagesCount = Math.ceil(totalCount / pageSize);
    return {
      totalCount,
      pageSize,
      pagesCount,
      page: query.pageNumber ? Number(query.pageNumber) : 1,
      sortBy: query.sortBy ? query.sortBy : 'createdAt',
      sortDirection: query.sortDirection ? query.sortDirection : 'asc',
    };
  }

  async postOutput(postId: string) {
    const findedPost = await this.pRepository
      .createQueryBuilder('p')
      .leftJoin('extendedLikesInfo', 'e', 'e."postId" = p."id"')
      .leftJoin('users', 'u', 'u."id" = p."userId"')
      .leftJoin('images', 'i', 'i."id" = p."imagesId"')
      .select([
        'p."id"',
        'p."title"',
        'p."shortDescription"',
        'p."content"',
        'p."blogId"',
        'p."blogName"',
        'p."createdAt"',
        'e."likesCount"',
        'e."dislikesCount"',
        'p."userId"',
        'u."login" AS "userLogin"',
        'p."imagesId"',
      ])
      .where('p.id = :id', { id: postId })
      .getRawOne();
    if (!findedPost) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }
    let post = {
      id: findedPost.id,
      title: findedPost.title,
      shortDescription: findedPost.shortDescription,
      content: findedPost.content,
      blogId: findedPost.blogId,
      blogName: findedPost.blogName,
      createdAt: findedPost.createdAt,
      extendedLikesInfo: {
        likesCount: findedPost.likesCount,
        dislikesCount: findedPost.dislikesCount,
      },
      imagesId: findedPost.imagesId,
    };
    const photoMetadata = await this.phRepository.find({
      // where: { imageId: post.imagesId },
      where: { postId: post.id },
    });
    // console.log('photoMetadata: ', photoMetadata);
    const findedBlog = await this.bRepository.findOne({
      where: { id: post.blogId },
      relations: ['banInfo'],
    });
    if (findedBlog?.banInfo.isBanned) {
      throw new NotFoundException(
        `Post with id ${post.blogId} not found or banned`,
      );
    }
    return this.postOutputMap(post, photoMetadata);
  }

  postOutputMap(post: any, photoMetadata?) {
    const {
      id,
      title,
      shortDescription,
      content,
      blogId,
      blogName,
      createdAt,
      extendedLikesInfo,
    } = post;
    let mainArr: Omit<
      PhotoSizeEntity,
      'id' | 'imageType' | 'imageId' | 'image' | 'post' | 'postId'
    >[] = [];
    if (photoMetadata) {
      photoMetadata.forEach((photo: PhotoSizeEntity) => {
        if (photo.imageType === ImageType.MAIN) {
          mainArr.push(this.photoSizeOutput(photo));
        }
      });
    }
    const output = {
      id: id.toString(),
      title,
      shortDescription,
      content,
      blogId: blogId.toString(),
      blogName,
      createdAt,
      extendedLikesInfo: {
        likesCount: extendedLikesInfo.likesCount,
        dislikesCount: extendedLikesInfo.dislikesCount,
      },
      ...(photoMetadata && {
        images: {
          main: mainArr,
        },
      }),
    };
    // if (photoMetadata) {
    //   output.images = {
    //     main: mainArr
    //   }
    // }
    return output;
  }

  // ---------------------_IMAGES_------------------------ //

  async getPhotoMetadata(postId: string) {
    const photoMetadata = await this.phRepository.find({
      where: { postId },
    });
    // console.log('post: ', post);
    let mainArr: Omit<
      PhotoSizeEntity,
      'id' | 'imageType' | 'imageId' | 'image' | 'post' | 'postId'
    >[] = [];
    photoMetadata.forEach((photo: PhotoSizeEntity) => {
      if (photo.imageType === ImageType.MAIN) {
        mainArr.push(this.photoSizeOutput(photo));
      }
    });
    return mainArr;
  }

  photoSizeOutput(
    photo: PhotoSizeEntity,
  ): Omit<
    PhotoSizeEntity,
    'id' | 'imageType' | 'imageId' | 'image' | 'post' | 'postId'
  > {
    return {
      url: photo.url,
      height: photo.height,
      width: photo.width,
      fileSize: photo.fileSize,
    };
  }
}
