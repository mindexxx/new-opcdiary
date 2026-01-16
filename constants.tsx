import { ChatStep } from './types';

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