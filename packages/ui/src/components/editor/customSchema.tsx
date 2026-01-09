import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import {
  CustomCodeBlock,
  MindMapBlock,
  CustomImageBlock,
  CustomVideoBlock,
  CustomAudioBlock,
} from './blocks';

// Create schema ONLY ONCE at module level - this is the key to avoiding plugin conflicts
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeBlock: CustomCodeBlock,
    mindMap: MindMapBlock,
    customImage: CustomImageBlock,
    customVideo: CustomVideoBlock,
    customAudio: CustomAudioBlock,
  },
});

export type CustomSchemaType = typeof customSchema;
