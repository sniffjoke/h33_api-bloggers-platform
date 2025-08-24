import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../src/core/settings/env/configuration';
import { BlogCreateModel } from '../../src/features/blogs/api/models/input/create-blog.input.model';
import request from 'supertest';
import { codeAuth } from './test-helpers';
import { BanInfoForUserDto } from '../../src/features/blogs/api/models/input/ban-user-for-blog.dto';
import { BanBlogBySuperDto } from '../../src/features/blogs/api/models/input/ban-blog.input.dto';

export class BlogsTestManager {
  constructor(
    protected readonly app: INestApplication,
    private configService: ConfigService<ConfigurationType, true>,
  ) {
  }

  async createBlog(createModel: BlogCreateModel) {
    const apiSettings = this.configService.get('apiSettings', { infer: true });
    const response = await request(this.app.getHttpServer())
      .post('/sa/blogs')
      .send(createModel)
      .set({ 'Authorization': `Basic ` + codeAuth(apiSettings.ADMIN) });
    return response;
  }

  async createBlogWOAuth(createModel: BlogCreateModel) {
    const response = await request(this.app.getHttpServer())
      .post('/sa/blogs')
      .send(createModel);
    return response;
  }

  async updateBlog(updModel: BlogCreateModel, blogId: string) {
    const apiSettings = this.configService.get('apiSettings', { infer: true });
    const response = await request(this.app.getHttpServer())
      .put('/sa/blogs/' + `${blogId}`)
      .send(updModel)
      .set({ 'Authorization': `Basic ` + codeAuth(apiSettings.ADMIN) });
    return response;
  }

  async getBlogs() {
    const response = await request(this.app.getHttpServer())
      .get('/blogs/');
    return response;
  }

  async getBlogsWithSA() {
    const apiSettings = this.configService.get('apiSettings', { infer: true });
    const response = await request(this.app.getHttpServer())
      .get('/sa/blogs/')
      .set({ 'Authorization': `Basic ` + codeAuth(apiSettings.ADMIN) });
    return response;
  }

  async getBlogById(blogId: string) {
    const response = await request(this.app.getHttpServer())
      .get('/blogs/' + `${blogId}`);
    return response;
  }

  async deleteBlog(blogId: string) {
    const apiSettings = this.configService.get('apiSettings', { infer: true });
    const response = await request(this.app.getHttpServer())
      .delete('/sa/blogs/' + `${blogId}`)
      .set({ 'Authorization': `Basic ` + codeAuth(apiSettings.ADMIN) })
      .expect(204);
    return response;
  }

  async bindWithUser(blogId: string , userId: string) {
    const apiSettings = this.configService.get('apiSettings', { infer: true });
    const response = await request(this.app.getHttpServer())
        .put('/sa/blogs/' + `${blogId}` + '/bind-with-user/' + `${userId}`)
        .set({ 'Authorization': `Basic ` + codeAuth(apiSettings.ADMIN) });
    return response;
  }

  //------------_BLOGGER PLATFORM_---------------//

  async createBlogByBlogger(createModel: BlogCreateModel, accessToken: string) {
    const response = await request(this.app.getHttpServer())
      .post('/blogger/blogs')
      .send(createModel)
      .set({ 'Authorization': 'Bearer ' +  accessToken});
    return response;
  }

  async banUserForBlog(createModel: BanInfoForUserDto, accessToken: string, id: string) {
    const response = await request(this.app.getHttpServer())
      .put('/blogger/users/' + `${id}` + '/ban')
      .send(createModel)
      .set({ 'Authorization': 'Bearer ' +  accessToken});
    return response;
  }

  async getUsersBannedForBlog(accessToken: string, blogId: string) {
    const response = await request(this.app.getHttpServer())
      .get(`/blogger/users/blog/${blogId}`)
      .set({ 'Authorization': 'Bearer ' +  accessToken});
    return response;
  }

  async banBlogBySuperUser(updModel: BanBlogBySuperDto, id: string) {
    const apiSettings = this.configService.get('apiSettings', { infer: true });
    const response = await request(this.app.getHttpServer())
      .put('/sa/blogs/' + `${id}` + '/ban')
      .send(updModel)
      .set({ 'Authorization': `Basic ` + codeAuth(apiSettings.ADMIN) });
    return response;
  }

}

export const createMockBlog = (uniqueIndex: number) => ({
  name: 'name' + `${uniqueIndex}`,
  description: 'description' + `${uniqueIndex}`,
  websiteUrl: 'http://some-' + `${uniqueIndex}` + '-url.com',
});


