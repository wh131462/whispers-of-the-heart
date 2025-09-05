// 测试blogApi的getPosts方法
import { blogApi } from './packages/utils/dist/index.mjs'

async function testBlogApi() {
  console.log('测试blogApi.getPosts()...')
  
  try {
    const response = await blogApi.getPosts({
      page: 1,
      limit: 10
    })
    
    console.log('响应:', JSON.stringify(response, null, 2))
    
    if (response.success) {
      console.log('✅ 博客查询成功')
      console.log(`文章数量: ${response.data?.items?.length || 0}`)
    } else {
      console.log('❌ 博客查询失败:', response.message)
    }
  } catch (error) {
    console.error('❌ 博客查询异常:', error)
  }
}

testBlogApi()
