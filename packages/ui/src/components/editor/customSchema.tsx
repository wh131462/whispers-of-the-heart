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
  CustomFileBlock,
  MathBlock,
  InlineMathBlock,
  InlineImage,
} from './blocks';

// 从默认块中移除 image, video, audio，使用自定义版本
const {
  image: _image,
  video: _video,
  audio: _audio,
  ...restBlockSpecs
} = defaultBlockSpecs;

// Create schema ONLY ONCE at module level - this is the key to avoiding plugin conflicts
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...restBlockSpecs,
    codeBlock: CustomCodeBlock,
    mindMap: MindMapBlock,
    // 使用自定义媒体块替代默认的 image, video, audio
    customImage: CustomImageBlock,
    customVideo: CustomVideoBlock,
    customAudio: CustomAudioBlock,
    customFile: CustomFileBlock,
    // 同时注册为默认名称，以便 HTML 解析时能识别
    image: CustomImageBlock,
    video: CustomVideoBlock,
    audio: CustomAudioBlock,
    file: CustomFileBlock,
    mathBlock: MathBlock,
    inlineMathBlock: InlineMathBlock,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    inlineImage: InlineImage,
  },
});

export type CustomSchemaType = typeof customSchema;
