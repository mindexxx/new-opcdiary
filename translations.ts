
import { Language, ChatStep } from './types';

export const TRANSLATIONS = {
  en: {
    // Onboarding
    greeting: "Hey stranger! I'm Rio, the developer of this place.",
    q1: "Welcome to the lonely club of Solo Founders. First things first, what shall we call your future empire?",
    p1: "e.g., Apple II, The Social Network...",
    r1: "Ooh, fancy. I can already see the IPO headline.",
    q2: "Sounds expensive. But what does it actually *do*? (Explain it like I'm 5, I have a short attention span).",
    p2: "It's like Uber but for...",
    r2: "Wait, people actually pay for that? Just kidding, sounds brilliant.",
    q3: "Ambitious. How long until you launch? Be honest, then multiply that by 3.",
    p3: "2 weeks (actually 6 months)",
    r3: "Classic developer optimism. I'll mark my calendar for next decade.",
    q4: "Who are we taking money from? I mean... serving? Who is your target user?",
    p4: "Gen Z, bored cats, aliens...",
    r4: "A very specific niche. I like it.",
    q5: "Let's manifest this. What's the target valuation? Put a number on your dreams.",
    p5: "$1,000,000,000",
    r5: "Pocket change. Aim higher next time.",
    q6: "We need a face for the brand. Upload a logo (or just a cool selfie, I don't judge).",
    p6: "",
    r6: "Looking sharp! Very professional-ish.",
    q7: "Last step before we start the diary. Secret handshake time. Set a password.",
    p7: "make-it-secure-plz",
    r7: "You're in. Let's make history.",
    // Dashboard
    searchPlaceholder: "Search groups or solo founders...",
    myGroups: "CLANS",
    myFriends: "FRIENDS",
    addProject: "Add Project",
    projectName: "Project Name",
    projectDesc: "One liner description",
    projectUrl: "Project Website URL",
    create: "Create",
    cancel: "Cancel",
    todayDiary: "Today's Log",
    writeDiary: "What did you build today?",
    uploadImage: "Upload Image",
    publish: "Publish",
    edit: "Edit",
    delete: "Delete",
    expand: "Expand History",
    collapse: "Collapse",
    roadmap: "Project Roadmap",
    roadmapTip: "Drag to pan, Scroll to zoom",
    resetView: "Right-click to reset",
    aiSummary: "AI Summary",
    join: "Join",
    add: "Add",
    added: "Added",
    commentPlaceholder: "Write a comment...",
    reply: "Reply",
    visit: "Visit",
    backToArchive: "Back to Archive",
    stage: "Stage",
    timeSpent: "Time Spent",
    cost: "Cost",
    profit: "Profit",
    editStat: "Edit Stats"
  },
  cn: {
    // Onboarding
    greeting: "嘿！我是 Rio，这里的开发者。",
    q1: "欢迎加入孤独的独立开发者俱乐部。首先，我们要怎么称呼你的未来商业帝国？",
    p1: "比如：苹果二代，脸书...",
    r1: "喔，听起来很贵气。我已经看到上市的新闻头条了。",
    q2: "名字不错。但它到底是*做*什么的？（请像对5岁小孩解释一样，我注意力很难集中）。",
    p2: "类似于 Uber，但是给...",
    r2: "等等，真的有人会为此付费吗？开玩笑的，听起来很棒。",
    q3: "很有野心。你觉得多久能上线？诚实点，然后把时间乘以3。",
    p3: "2周（实际上是6个月）",
    r3: "典型的开发者乐观主义。我会在下个十年做个标记。",
    q4: "我们要赚谁的钱？呃我是说...服务谁？你的目标用户是谁？",
    p4: "Z世代，无聊的猫，外星人...",
    r4: "很垂直的利基市场。我喜欢。",
    q5: "让我们来显化一下。目标估值是多少？给梦想标个价。",
    p5: "100个小目标",
    r5: "零花钱而已。下次胆子大点。",
    q6: "我们需要一个门面。上传个Logo（或者帅气的自拍，我不评判）。",
    p6: "",
    r6: "看起来很犀利！非常专业（大概）。",
    q7: "开始写日记前的最后一步。设置一个只有你知道的暗号（密码）。",
    p7: "安全第一",
    r7: "搞定。让我们开始创造历史。",
    // Dashboard
    searchPlaceholder: "搜索群组或独立开发者...",
    myGroups: "圈子",
    myFriends: "好友",
    addProject: "添加项目",
    projectName: "项目名称",
    projectDesc: "一句话简介",
    projectUrl: "项目网址",
    create: "创建",
    cancel: "取消",
    todayDiary: "今日日记",
    writeDiary: "今天构建了什么？",
    uploadImage: "上传图片",
    publish: "发布",
    edit: "编辑",
    delete: "删除",
    expand: "展开历史",
    collapse: "收起",
    roadmap: "项目 Roadmap",
    roadmapTip: "拖拽移动，滚轮缩放",
    resetView: "右键复原",
    aiSummary: "智能总结",
    join: "加入",
    add: "添加",
    added: "已添加",
    commentPlaceholder: "写下评论...",
    reply: "回复",
    visit: "访问",
    backToArchive: "返回档案库",
    stage: "项目阶段",
    timeSpent: "项目已耗时",
    cost: "已消耗成本",
    profit: "已获利润",
    editStat: "修改统计"
  }
};

export const getSteps = (lang: Language, steps: ChatStep[]): ChatStep[] => {
  const t = TRANSLATIONS[lang];
  return steps.map(step => {
    switch(step.id) {
      case 1: return { ...step, question: t.q1, placeholder: t.p1, reaction: t.r1 };
      case 2: return { ...step, question: t.q2, placeholder: t.p2, reaction: t.r2 };
      case 3: return { ...step, question: t.q3, placeholder: t.p3, reaction: t.r3 };
      case 4: return { ...step, question: t.q4, placeholder: t.p4, reaction: t.r4 };
      case 5: return { ...step, question: t.q5, placeholder: t.p5, reaction: t.r5 };
      case 6: return { ...step, question: t.q6, placeholder: t.p6, reaction: t.r6 };
      case 7: return { ...step, question: t.q7, placeholder: t.p7, reaction: t.r7 };
      default: return step;
    }
  });
};
