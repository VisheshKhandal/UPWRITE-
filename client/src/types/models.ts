export type Id = string;

export type UserRole = "user" | "admin" | "moderator";

export interface ImageAsset {
  url?: string;
  publicId?: string;
  secureUrl?: string;
}

export interface UserStats {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  articlesCount: number;
  achievementsCount: number;
}

export interface User {
  _id: Id;
  name: string;
  username: string;
  email?: string;
  role?: UserRole;
  emailVerified?: boolean;
  avatar?: ImageAsset;
  bio?: string;
  skills?: string[];
  interests?: string[];
  socialLinks?: {
    website?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  bannerImage?: ImageAsset;
  location?: string;
  verified?: boolean;
  isFollowing?: boolean;
  stats?: UserStats;
  appearanceSettings?: AppearanceSettings;
  privacySettings?: PrivacySettings;
  securitySettings?: SecuritySettings;
  onboarding?: OnboardingState;
  likesReceived?: number;
  createdAt?: string;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large" | "extra-large";
  readingWidth: "narrow" | "comfortable" | "wide";
  reduceMotion: boolean;
  highContrast: boolean;
  compactLayout: boolean;
  showReadingTime: boolean;
  showViewCounts: boolean;
  showLikeCounts: boolean;
  showAuthorStats: boolean;
  language: "en" | "hi";
  autoSaveInterval: "30s" | "1m" | "5m" | "disabled";
  focusWritingMode: boolean;
}

export interface PrivacySettings {
  profileVisibility: "public" | "private";
  showEmail: boolean;
  showJoinDate: boolean;
  showSocialLinks: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  recoveryEmail?: string;
  recoveryEmailVerified?: boolean;
  emailAlerts: boolean;
  inAppNotifications: boolean;
}

export interface OnboardingState {
  required?: boolean;
  completed?: boolean;
  completedAt?: string;
  identity?: "student" | "developer" | "creator" | "writer" | "freelancer" | "founder" | "learner";
  goals?: Array<"learn_skills" | "build_personal_brand" | "share_knowledge" | "document_journey" | "grow_audience" | "find_opportunities">;
  learningPreferences?: Array<"short_reads" | "deep_dives" | "project_based" | "community_discussion">;
  writingPreferences?: Array<"quick_posts" | "long_form" | "learning_logs" | "tutorials">;
  tourCompletedAt?: string;
}

export type PostType = "learning" | "achievement" | "insight" | "update";

export interface Engagement {
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  sharesCount: number;
}

export interface Post {
  _id: Id;
  author: User;
  title?: string;
  type: PostType;
  body: string;
  tags?: string[];
  media?: ImageAsset[];
  engagement?: Engagement;
  createdAt: string;
  updatedAt?: string;
}

export type ArticleStatus = "draft" | "published" | "archived";

export interface ArticleStats {
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  sharesCount: number;
}

export interface Article {
  _id: Id;
  author: User;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  status: ArticleStatus;
  tags?: string[];
  coverImage?: ImageAsset;
  readingTimeMinutes: number;
  stats?: ArticleStats;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ContentType = "post" | "article";

export interface Comment {
  _id: Id;
  author: User;
  contentType: ContentType;
  contentId: Id;
  parentComment?: Id;
  body: string;
  createdAt: string;
}

export interface Collection {
  _id: Id;
  owner: Id;
  name: string;
  description?: string;
  isPublic: boolean;
  itemsCount: number;
  createdAt: string;
}

export interface Bookmark {
  _id: Id;
  user: Id;
  contentType: ContentType;
  contentId: Id;
  collection?: Id | Collection;
  createdAt: string;
}

export interface SavedItem extends Bookmark {
  item?: Article | Post;
}

export type NotificationType = "follow" | "like" | "comment" | "reply" | "mention" | "article_interaction";

export interface Notification {
  _id: Id;
  recipient: Id;
  actor?: User;
  type: NotificationType;
  message: string;
  entityType?: string;
  entityId?: Id;
  readAt?: string;
  createdAt: string;
}

export interface UploadAsset {
  _id: Id;
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  context: "avatar" | "article_cover" | "post_media";
}

export interface Tag {
  _id: Id;
  name: string;
  slug: string;
  usageCount: number;
}

export interface FeedItem {
  type: "post" | "article";
  createdAt?: string;
  item: Post | Article;
}
