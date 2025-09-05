import { Controller, Get } from '@nestjs/common'
import { ApiResponseDto } from './dto/api-response.dto'

@Controller('hitokoto')
export class HitokotoController {
  @Get()
  async getHitokoto() {
    try {
      const response = await fetch('https://v1.hitokoto.cn/')
      if (!response.ok) {
        throw new Error('Failed to fetch hitokoto')
      }
      const data = await response.json()
      return ApiResponseDto.success(data, '获取一言成功')
    } catch (error) {
      console.error('Hitokoto API error:', error)
      // 返回默认的一言
      const defaultHitokoto = {
        hitokoto: '生活不止眼前的代码，还有诗和远方。',
        from: '默认',
        from_who: null,
        creator: '系统',
        creator_uid: 0,
        reviewer: 0,
        uuid: 'default',
        commit_from: 'web',
        created_at: new Date().toISOString(),
        length: 0,
        type: 'a'
      }
      return ApiResponseDto.success(defaultHitokoto, '获取默认一言')
    }
  }
}
