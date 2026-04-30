import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Video, VideoDocument } from '../video/schemas/video.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';

type CommentSort = 'top' | 'newest';

type PopulatedAuthor = {
  _id: Types.ObjectId;
  username?: string;
  email?: string;
  avatar?: string;
};

type LeanComment = {
  _id: Types.ObjectId;
  video: Types.ObjectId;
  author: Types.ObjectId | PopulatedAuthor;
  content: string;
  likedBy?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

type SerializedComment = {
  _id: string;
  content: string;
  likes: number;
  isLiked: boolean;
  author: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
};

const authorSelect = 'username email avatar';

function isPopulatedAuthor(
  author: Types.ObjectId | PopulatedAuthor,
): author is PopulatedAuthor {
  return !(author instanceof Types.ObjectId);
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Video.name)
    private readonly videoModel: Model<VideoDocument>,
  ) {}

  async getForVideo(
    videoId: string,
    sort: CommentSort = 'top',
    viewerId?: string,
  ): Promise<SerializedComment[]> {
    this.ensureObjectId(videoId, 'Video not found');

    const sortSpec: Record<string, 1 | -1> =
      sort === 'newest' ? { createdAt: -1 } : { likesCount: -1, createdAt: -1 };
    const pipeline: PipelineStage[] = [
      { $match: { video: new Types.ObjectId(videoId) } },
      { $addFields: { likesCount: { $size: '$likedBy' } } },
      { $sort: sortSpec },
    ];

    const comments = await this.commentModel
      .aggregate<LeanComment & { likesCount: number }>(pipeline)
      .exec();

    await this.commentModel.populate(comments, {
      path: 'author',
      select: authorSelect,
    });

    return comments.map((comment) => this.serialize(comment, viewerId));
  }

  async create(
    videoId: string,
    authorId: string,
    content: string,
  ): Promise<SerializedComment> {
    this.ensureObjectId(videoId, 'Video not found');
    this.ensureObjectId(authorId, 'Invalid user');

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const videoExists = await this.videoModel.exists({
      _id: new Types.ObjectId(videoId),
    });
    if (!videoExists) {
      throw new NotFoundException('Video not found');
    }

    const created = await this.commentModel.create({
      video: new Types.ObjectId(videoId),
      author: new Types.ObjectId(authorId),
      content: trimmedContent,
      likedBy: [],
    });

    const comment = await this.commentModel
      .findById(created._id)
      .populate<{ author: PopulatedAuthor }>('author', authorSelect)
      .lean<LeanComment | null>()
      .exec();

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.serialize(comment, authorId);
  }

  async toggleLike(
    videoId: string,
    commentId: string,
    userId: string,
  ): Promise<SerializedComment> {
    this.ensureObjectId(videoId, 'Video not found');
    this.ensureObjectId(commentId, 'Comment not found');
    this.ensureObjectId(userId, 'Invalid user');

    const comment = await this.commentModel
      .findOne({
        _id: new Types.ObjectId(commentId),
        video: new Types.ObjectId(videoId),
      })
      .exec();

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const hasLiked = comment.likedBy.some(
      (likedUserId) => likedUserId.toString() === userId,
    );

    comment.likedBy = hasLiked
      ? comment.likedBy.filter(
          (likedUserId) => likedUserId.toString() !== userId,
        )
      : [...comment.likedBy, userObjectId];

    await comment.save();

    const updated = await this.commentModel
      .findById(comment._id)
      .populate<{ author: PopulatedAuthor }>('author', authorSelect)
      .lean<LeanComment | null>()
      .exec();

    if (!updated) {
      throw new NotFoundException('Comment not found');
    }

    return this.serialize(updated, userId);
  }

  private ensureObjectId(value: string, message: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new NotFoundException(message);
    }
  }

  private serialize(
    comment: LeanComment,
    viewerId?: string,
  ): SerializedComment {
    const author = isPopulatedAuthor(comment.author)
      ? comment.author
      : undefined;
    const likedBy = comment.likedBy ?? [];

    return {
      _id: comment._id.toString(),
      content: comment.content,
      likes: likedBy.length,
      isLiked: viewerId
        ? likedBy.some((likedUserId) => likedUserId.toString() === viewerId)
        : false,
      author: {
        _id: author?._id.toString() ?? '',
        username: author?.username ?? 'Unknown User',
        email: author?.email ?? '',
        avatar: author?.avatar,
      },
      createdAt: comment.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: comment.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
