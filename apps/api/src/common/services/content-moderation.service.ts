import { Injectable, Logger } from '@nestjs/common';

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  reasons: string[];
  suggestions?: string[];
}

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  /**
   * 基础内容检测
   * 检测常见的垃圾信息、敏感词等
   */
  async moderateContent(content: string): Promise<ModerationResult> {
    const reasons: string[] = [];
    let confidence = 1.0;

    // 检测空内容
    if (!content || content.trim().length === 0) {
      return {
        isApproved: false,
        confidence: 1.0,
        reasons: ['内容为空'],
      };
    }

    // 检测最小长度
    if (content.trim().length < 3) {
      return {
        isApproved: false,
        confidence: 0.9,
        reasons: ['内容过短'],
      };
    }

    // 检测最大长度
    if (content.length > 5000) {
      return {
        isApproved: false,
        confidence: 0.8,
        reasons: ['内容过长'],
      };
    }

    // 检测重复字符（如：aaaaaaaa）
    const repeatedCharPattern = /(.)\1{10,}/;
    if (repeatedCharPattern.test(content)) {
      reasons.push('包含过多重复字符');
      confidence -= 0.3;
    }

    // 检测全大写内容
    if (content === content.toUpperCase() && content.length > 20) {
      reasons.push('全大写内容');
      confidence -= 0.2;
    }

    // 检测链接数量
    const linkPattern = /https?:\/\/[^\s]+/g;
    const links = content.match(linkPattern);
    if (links && links.length > 3) {
      reasons.push('包含过多链接');
      confidence -= 0.4;
    }

    // 检测敏感词（基础版本）
    const sensitiveWords = [
      '垃圾', '废物', '傻逼', '白痴', '智障',
      'fuck', 'shit', 'damn', 'bitch',
      '政治敏感词', '色情', '暴力'
    ];
    
    const hasSensitiveWords = sensitiveWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasSensitiveWords) {
      reasons.push('包含敏感词汇');
      confidence -= 0.6;
    }

    // 检测垃圾信息模式
    const spamPatterns = [
      /(.)\1{5,}/, // 重复字符
      /[0-9]{10,}/, // 长数字串
      /[^\w\s\u4e00-\u9fff]{10,}/, // 特殊字符过多
    ];

    const hasSpamPatterns = spamPatterns.some(pattern => pattern.test(content));
    if (hasSpamPatterns) {
      reasons.push('疑似垃圾信息');
      confidence -= 0.5;
    }

    // 检测是否包含有意义的内容
    const meaningfulContent = this.extractMeaningfulContent(content);
    if (meaningfulContent.length < 5) {
      reasons.push('内容缺乏意义');
      confidence -= 0.4;
    }

    const isApproved = confidence >= 0.5 && reasons.length === 0;

    return {
      isApproved,
      confidence,
      reasons,
      suggestions: this.generateSuggestions(reasons),
    };
  }

  /**
   * 提取有意义的内容
   */
  private extractMeaningfulContent(content: string): string {
    // 移除HTML标签
    let cleanContent = content.replace(/<[^>]*>/g, '');
    
    // 移除多余空格
    cleanContent = cleanContent.replace(/\s+/g, ' ').trim();
    
    // 移除特殊字符
    cleanContent = cleanContent.replace(/[^\w\s\u4e00-\u9fff]/g, '');
    
    return cleanContent;
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(reasons: string[]): string[] {
    const suggestions: string[] = [];
    
    if (reasons.includes('内容过短')) {
      suggestions.push('请提供更详细的评论内容');
    }
    
    if (reasons.includes('包含过多重复字符')) {
      suggestions.push('请避免使用重复字符');
    }
    
    if (reasons.includes('全大写内容')) {
      suggestions.push('请使用正常的大小写格式');
    }
    
    if (reasons.includes('包含过多链接')) {
      suggestions.push('请减少链接数量');
    }
    
    if (reasons.includes('包含敏感词汇')) {
      suggestions.push('请使用文明用语');
    }
    
    if (reasons.includes('疑似垃圾信息')) {
      suggestions.push('请提供有意义的评论内容');
    }
    
    return suggestions;
  }

  /**
   * 集成第三方内容检测API（示例：阿里云内容安全）
   * 这里提供接口，实际使用时需要配置API密钥
   */
  async moderateWithThirdParty(content: string): Promise<ModerationResult> {
    try {
      // 这里可以集成阿里云、腾讯云等内容安全API
      // 示例代码：
      /*
      const response = await this.httpService.post('https://green-cn-shanghai.aliyuncs.com/green/text/scan', {
        tasks: [{
          dataId: Date.now().toString(),
          content: content
        }]
      }).toPromise();
      
      const result = response.data[0];
      return {
        isApproved: result.suggestion === 'pass',
        confidence: result.rate,
        reasons: result.labels || [],
      };
      */
      
      // 暂时返回基础检测结果
      return this.moderateContent(content);
    } catch (error) {
      this.logger.error('第三方内容检测失败，使用基础检测', error);
      return this.moderateContent(content);
    }
  }
}
