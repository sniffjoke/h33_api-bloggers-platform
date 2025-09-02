import {Injectable, NotFoundException} from '@nestjs/common';
import {PostCreateModel, PostCreateModelWithParams} from '../api/models/input/create-post.input.model';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PostEntity} from '../domain/posts.entity';
import {ExtendedLikesInfoEntity} from '../domain/extended-likes-info.entity';
import {UserEntity} from "../../users/domain/user.entity";
import { BlogEntity } from '../../blogs/domain/blogs.entity';
import { PhotoSizeViewModel } from '../../blogs/api/models/output/photo-size.view.model';
import { PhotoSizeEntity } from '../../blogs/domain/photoSize.entity';


@Injectable()
export class PostsRepositoryTO {

    constructor(
        @InjectRepository(PostEntity) private readonly pRepository: Repository<PostEntity>,
        @InjectRepository(PhotoSizeEntity) private readonly phRepository: Repository<PhotoSizeEntity>
    ) {
    }

    async createPost(postData: PostCreateModel, blogName: string, blog: BlogEntity, user?: UserEntity): Promise<string> {
        const post = new PostEntity();
        post.title = postData.title;
        post.shortDescription = postData.shortDescription;
        post.content = postData.content;
        post.blogId = postData.blogId;
        post.imagesId = blog.imagesId;
        post.blogName = blogName;
        if (user) {
            post.user = user
        }
        const newPost = await this.pRepository.save(post);

        const extendedLikesInfo = new ExtendedLikesInfoEntity();
        extendedLikesInfo.postId = newPost.id;

        extendedLikesInfo.post = post;

        await this.pRepository.manager.save(extendedLikesInfo);

        return newPost.id;
    }

    async findPostById(id: string) {
        const findedPost = await this.pRepository.findOne(
            {where: {id}},
        );
        if (!findedPost) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }
        return findedPost;
    }

    async updatePostFromBlogsUri(
        postId: string,
        blogId: string,
        newPostData: Partial<PostCreateModelWithParams>,
    ) {
        const findedPost = await this.findPostById(postId);
        Object.assign(findedPost, {...newPostData, blogId});
        return await this.pRepository.save(findedPost);
    }

    async deletePostFromBlogsUri(postId: string, blogId: string) {
        const findedPost = await this.findPostById(postId);
        const deletePost = await this.pRepository.delete(
            {id: postId, blogId},
        );
        return deletePost;
    }

    async getAllPosts() {
        return await this.pRepository.find(
          {relations: ['extendedLikesInfo']},
        );
    }

    async savePost(post: PostEntity) {
        return await this.pRepository.save(post);
    }


    // ----------------------_IMAGES_------------------------- //

    async addMainImageToPost(blog: BlogEntity, post: PostEntity, dto: PhotoSizeViewModel) {
        const phSize = new PhotoSizeEntity();
        phSize.height = dto.height!;
        phSize.width = dto.width!;
        phSize.fileSize = dto.fileSize!;
        phSize.url = dto.url;
        phSize.imageId = blog.images.id;
        await this.phRepository.save(phSize);
        const updatedBlog = await this.findPostById(post.id);
        return updatedBlog;
    }

}
