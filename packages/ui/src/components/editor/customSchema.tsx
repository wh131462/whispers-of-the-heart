import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from '@blocknote/core';
import {
  CustomCodeBlock,
  MindMapBlock,
  CustomImageBlock,
  CustomVideoBlock,
  CustomAudioBlock,
  MathBlock,
  InlineMathBlock,
  InlineImage,
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
    mathBlock: MathBlock,
    inlineMathBlock: InlineMathBlock,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    inlineImage: InlineImage,
  },
});

export type CustomSchemaType = typeof customSchema;
