/**
 * 自定义 Slash Menu 配置
 */

import React from 'react';
import {
  ImageIcon,
  VideoIcon,
  AudioIcon,
  FileIcon,
  MindMapIcon,
  MathIcon,
  QuoteIcon,
} from '../assets/icons';
import {
  SLASH_MENU_GROUP_ORDER,
  SLASH_MENU_GROUP_MAPPING,
  EXCLUDED_SLASH_MENU_ITEMS,
} from './config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Editor = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SlashMenuItem = any;

/**
 * 创建自定义媒体块菜单项
 */
export const createCustomMediaItems = (editor: Editor): SlashMenuItem[] => [
  {
    title: '图片',
    subtext: '插入图片',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: 'customImage' as const,
            props: { url: '', caption: '' },
          },
        ],
        currentBlock,
        'after'
      );
    },
    aliases: ['image', 'img', 'picture', 'photo', 'tupian'],
    group: '媒体',
    icon: <ImageIcon size={18} />,
  },
  {
    title: '视频',
    subtext: '插入视频',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: 'customVideo' as const,
            props: { url: '', caption: '' },
          },
        ],
        currentBlock,
        'after'
      );
    },
    aliases: ['video', 'movie', 'shipin'],
    group: '媒体',
    icon: <VideoIcon size={18} />,
  },
  {
    title: '音频',
    subtext: '插入音频',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: 'customAudio' as const,
            props: { url: '', caption: '' },
          },
        ],
        currentBlock,
        'after'
      );
    },
    aliases: ['audio', 'music', 'sound', 'yinpin'],
    group: '媒体',
    icon: <AudioIcon size={18} />,
  },
  {
    title: '文件',
    subtext: '插入文件附件',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: 'customFile' as const,
            props: { url: '', caption: '', fileSize: 0 },
          },
        ],
        currentBlock,
        'after'
      );
    },
    aliases: ['file', 'attachment', 'wenjian', 'fujian'],
    group: '媒体',
    icon: <FileIcon size={18} />,
  },
];

/**
 * 创建高级功能菜单项
 */
export const createAdvancedItems = (editor: Editor): SlashMenuItem[] => [
  {
    title: '思维导图',
    subtext: '插入思维导图',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: 'mindMap' as const,
            props: {
              markdown: '# 新建思维导图\n\n## 主题 1\n\n## 主题 2',
            },
          },
        ],
        currentBlock,
        'after'
      );
    },
    aliases: ['mindmap', 'mind map', 'siwei', 'siweidaotu'],
    group: '高级',
    icon: <MindMapIcon size={18} />,
  },
  {
    title: '数学公式',
    subtext: '插入 LaTeX 数学公式',
    onItemClick: () => {
      const currentBlock = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: 'mathBlock' as const,
            props: { formula: '' },
          },
        ],
        currentBlock,
        'after'
      );
    },
    aliases: ['math', 'formula', 'equation', 'latex', 'shuxue', 'gongshi'],
    group: '高级',
    icon: <MathIcon size={18} />,
  },
];

/**
 * 创建引用块菜单项
 */
export const createQuoteItem = (editor: Editor): SlashMenuItem => ({
  title: '引用',
  subtext: '插入引用块',
  onItemClick: () => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks(
      [
        {
          type: 'quote' as const,
        },
      ],
      currentBlock,
      'after'
    );
  },
  aliases: ['quote', 'blockquote', 'yinyong', 'cite'],
  group: '基础块',
  icon: <QuoteIcon size={18} />,
});

/**
 * 过滤默认菜单项（移除默认媒体块和折叠块）
 */
export const filterDefaultSlashMenuItems = (
  items: SlashMenuItem[]
): SlashMenuItem[] => {
  return items.filter((item: SlashMenuItem) => {
    const title = item.title.toLowerCase();
    return !EXCLUDED_SLASH_MENU_ITEMS.some(excluded =>
      title.includes(excluded)
    );
  });
};

/**
 * 重新映射分组名称为中文
 */
export const remapGroupNames = (items: SlashMenuItem[]): SlashMenuItem[] => {
  return items.map((item: SlashMenuItem) => ({
    ...item,
    group:
      SLASH_MENU_GROUP_MAPPING[item.group?.toLowerCase()] ||
      item.group ||
      '其他',
  }));
};

/**
 * 按分组顺序排序
 */
export const sortByGroupOrder = (items: SlashMenuItem[]): SlashMenuItem[] => {
  return [...items].sort((a: SlashMenuItem, b: SlashMenuItem) => {
    const aIndex = SLASH_MENU_GROUP_ORDER.indexOf(a.group);
    const bIndex = SLASH_MENU_GROUP_ORDER.indexOf(b.group);
    const aOrder = aIndex === -1 ? SLASH_MENU_GROUP_ORDER.length : aIndex;
    const bOrder = bIndex === -1 ? SLASH_MENU_GROUP_ORDER.length : bIndex;
    return aOrder - bOrder;
  });
};

/**
 * 获取完整的自定义 slash menu 项目（用于 BlockNoteEditor）
 */
export const getFullCustomSlashMenuItems = (
  editor: Editor,
  defaultItems: SlashMenuItem[]
): SlashMenuItem[] => {
  const filteredItems = filterDefaultSlashMenuItems(defaultItems);
  const remappedItems = remapGroupNames(filteredItems);
  const customMediaItems = createCustomMediaItems(editor);
  const advancedItems = createAdvancedItems(editor);

  const allItems = [...remappedItems, ...customMediaItems, ...advancedItems];
  return sortByGroupOrder(allItems);
};

/**
 * CommentEditor 允许的斜杠菜单项类型
 */
const COMMENT_ALLOWED_SLASH_ITEMS = [
  'Heading 1',
  'Heading 2',
  'Heading 3',
  'Heading 4',
  'Heading 5',
  'Heading 6',
  'Table',
  'Code Block',
  'Bullet List',
  'Numbered List',
  'Check List',
  '一级标题',
  '二级标题',
  '三级标题',
  '四级标题',
  '五级标题',
  '六级标题',
  '表格',
  '代码块',
  '无序列表',
  '有序列表',
  '待办列表',
];

/**
 * 获取 CommentEditor 的自定义 slash menu 项目
 */
export const getCommentSlashMenuItems = (
  editor: Editor,
  defaultItems: SlashMenuItem[]
): SlashMenuItem[] => {
  // 过滤默认项:保留允许的,排除toggle和默认媒体块
  const filtered = defaultItems.filter((item: SlashMenuItem) => {
    const title = item.title.toLowerCase();
    if (EXCLUDED_SLASH_MENU_ITEMS.some(excluded => title.includes(excluded))) {
      return false;
    }
    return COMMENT_ALLOWED_SLASH_ITEMS.some(
      allowed => title === allowed.toLowerCase()
    );
  });

  const remappedItems = remapGroupNames(filtered);
  const customMediaItems = createCustomMediaItems(editor);
  const advancedItems = createAdvancedItems(editor);
  const quoteItem = createQuoteItem(editor);

  const allItems = [
    ...remappedItems,
    ...customMediaItems,
    ...advancedItems,
    quoteItem,
  ];
  return sortByGroupOrder(allItems);
};
