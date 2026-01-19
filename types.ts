
import React from 'react';

export type Language = 'en' | 'cn';

export interface UserProfile {
  companyName: string;
  description: string;
  devTime: string;
  audience: string;
  valuation: string;
  avatar: string | null;
  projectUrl?: string; // Link to the user's project
  projectCover?: string | null; // Background image for the visit button
  password: string;
  title?: string; // Editable user title (e.g. Solo Founder)
}

export interface ChatStep {
  id: number;
  question: string;
  field: keyof UserProfile;
  placeholder: string;
  type: 'text' | 'file' | 'password';
  reaction?: string;
}

export interface Message {
  sender: 'RIO' | 'USER';
  text: string | React.ReactNode;
  id: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  isOwner: boolean;
  avatar?: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  timestamp: number;
  content: string;
  images: string[];
  comments: Comment[];
}

export interface ProjectStats {
  stage: string;
  timeSpent: string;
  cost: string;
  profit: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  stats?: ProjectStats; // Added stats
  entries: DiaryEntry[];
}

export interface Group {
  id: string;
  name: string;
  avatar: string; // Color or Image URL
  description: string;
  type: 'group' | 'user';
}

export interface ForumComment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: number;
}

export interface ForumPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
  };
  content: string;
  image?: string | null; // Added image
  link?: string | null; // Added link
  category?: string; // Added category
  timestamp: number;
  likes: number;
  likedBy?: string[]; // Changed from likedByMe to array of usernames for cumulative logic
  comments: number;
  commentsList?: ForumComment[];
  tags: string[];
}
