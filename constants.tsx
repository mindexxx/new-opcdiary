
import { ChatStep, ForumPost } from './types';

// Structure remains, content is now handled by translations.ts
export const ONBOARDING_STEPS_BASE: ChatStep[] = [
  {
    id: 1,
    field: 'companyName',
    question: "", // filled dynamically
    placeholder: "",
    type: 'text',
    reaction: ""
  },
  {
    id: 2,
    field: 'description',
    question: "",
    placeholder: "",
    type: 'text',
    reaction: ""
  },
  {
    id: 3,
    field: 'devTime',
    question: "",
    placeholder: "",
    type: 'text',
    reaction: ""
  },
  {
    id: 4,
    field: 'audience',
    question: "",
    placeholder: "",
    type: 'text',
    reaction: ""
  },
  {
    id: 5,
    field: 'valuation',
    question: "",
    placeholder: "",
    type: 'text',
    reaction: ""
  },
  {
    id: 6,
    field: 'avatar',
    question: "",
    placeholder: "",
    type: 'file',
    reaction: ""
  },
  {
    id: 7,
    field: 'password',
    question: "",
    placeholder: "",
    type: 'password',
    reaction: ""
  }
];

export const MOCK_GROUPS = [
  { id: 'g1', name: 'SaaS Makers', avatar: '#3B82F6', description: 'Building software services.', type: 'group' as const },
  { id: 'g2', name: 'Indie Hackers', avatar: '#10B981', description: 'Profitable side projects.', type: 'group' as const },
  { id: 'u1', name: 'DevSarah', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', description: 'Building a CRM for cats.', type: 'user' as const },
  { id: 'u2', name: 'CodeMike', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', description: 'AI generated poetry.', type: 'user' as const },
];

export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: 'f1',
    author: {
      name: 'CodeMike',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      title: 'AI Poet'
    },
    content: "Just launched my MVP on Product Hunt! The feedback is overwhelming but I found a critical bug in the login flow. Anyone else deal with post-launch panic?",
    timestamp: Date.now() - 10000000,
    likes: 42,
    likedByMe: false,
    comments: 2,
    commentsList: [
      { id: 'c1', author: { name: 'DevSarah', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' }, content: "Panic is part of the process! Fix it and move on.", timestamp: Date.now() - 900000 },
      { id: 'c2', author: { name: 'Guest', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest' }, content: "Congrats on launching though!", timestamp: Date.now() - 800000 }
    ],
    tags: ['Launch', 'Bug Fix']
  },
  {
    id: 'f2',
    author: {
      name: 'DevSarah',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      title: 'CatCRM Founder'
    },
    content: "Looking for recommendations on payment gateways that support crypto but are user friendly for non-techies. Any suggestions?",
    timestamp: Date.now() - 5000000,
    likes: 15,
    likedByMe: true,
    comments: 0,
    commentsList: [],
    tags: ['Help', 'Payments']
  }
];
