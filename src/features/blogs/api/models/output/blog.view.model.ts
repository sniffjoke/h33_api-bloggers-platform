import {CommentatorInfoModel} from "../../../../comments/api/models/output/comment.view.model";
import { BanBlogInfoViewModel } from './ban-blog-info.view.model';
import { BlogImagesViewModel } from './blog-images.view.model';

export class BlogViewModel {
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    createdAt: string;
    isMembership: boolean;
    blogOwnerInfo?: CommentatorInfoModel;
    banInfo?: BanBlogInfoViewModel;
    images: BlogImagesViewModel | null = null;
}
