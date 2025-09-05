#!/bin/bash

echo "🧪 测试博客系统..."

# 测试API健康检查
echo "1. 测试API健康检查..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7777/api/v1)
if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API服务正常"
else
    echo "❌ API服务异常 (状态码: $API_RESPONSE)"
fi

# 测试获取文章列表
echo "2. 测试获取文章列表..."
POSTS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7777/api/v1/blog)
if [ "$POSTS_RESPONSE" = "200" ]; then
    echo "✅ 文章列表接口正常"
else
    echo "❌ 文章列表接口异常 (状态码: $POSTS_RESPONSE)"
fi

# 测试管理员登录
echo "3. 测试管理员登录..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:7777/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ 管理员登录成功"
    # 提取token
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:20}..."
else
    echo "❌ 管理员登录失败"
    echo "响应: $LOGIN_RESPONSE"
fi

# 测试Web前端
echo "4. 测试Web前端..."
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7777)
if [ "$WEB_RESPONSE" = "200" ]; then
    echo "✅ Web前端正常"
else
    echo "❌ Web前端异常 (状态码: $WEB_RESPONSE)"
fi

# 测试Admin前端
echo "5. 测试Admin前端..."
ADMIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7777)
if [ "$ADMIN_RESPONSE" = "200" ]; then
    echo "✅ Admin前端正常"
else
    echo "❌ Admin前端异常 (状态码: $ADMIN_RESPONSE)"
fi

echo ""
echo "🎯 测试完成！"
echo ""
echo "📱 访问地址："
echo "  - Web前端: http://localhost:7777"
echo "  - Admin后台: http://localhost:7777"
echo "  - API文档: http://localhost:7777/api/v1"
echo ""
echo "👤 管理员账户："
echo "  - 用户名: admin"
echo "  - 密码: admin123"
