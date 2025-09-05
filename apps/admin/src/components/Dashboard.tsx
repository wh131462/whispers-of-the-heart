import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Users, FileText, BarChart3, TrendingUp } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: '总用户数',
      value: '12,345',
      description: '较上月增长 12%',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: '内容数量',
      value: '2,847',
      description: '较上月增长 8%',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: '访问量',
      value: '89,123',
      description: '较上月增长 23%',
      icon: BarChart3,
      color: 'text-purple-600',
    },
    {
      title: '转化率',
      value: '3.2%',
      description: '较上月增长 1.2%',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">
          欢迎回来！这里是您的管理后台概览。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>访问趋势</CardTitle>
            <CardDescription>
              最近30天的网站访问量统计
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              图表区域 - 这里可以集成 Chart.js 或 Recharts
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>
              系统最新动态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '2分钟前', action: '新用户注册', user: '张三' },
                { time: '5分钟前', action: '内容发布', user: '李四' },
                { time: '10分钟前', action: '系统更新', user: '系统' },
                { time: '15分钟前', action: '用户登录', user: '王五' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
