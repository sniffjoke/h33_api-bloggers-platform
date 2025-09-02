import { ImagesViewModel } from '../../../../blogs/api/models/output/images.view.model';

export enum LikeStatus {
    None = 'None',
    Like = 'Like',
    Dislike = 'Dislike'
}

export class PostViewModel {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: string;
    images: Omit<ImagesViewModel, 'wallpaper'>;
}
