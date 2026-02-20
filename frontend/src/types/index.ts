import { ParsedUrlQuery } from 'querystring';

export interface Post {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditPostProps {
  post: Post;
}

export interface PostQuery extends ParsedUrlQuery {
  postId: string;
}
