import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { useAuthStore } from '../stores/useAuthStore'
import { Settings, Bell, Shield, Palette, Moon, Sun, Save } from 'lucide-react'

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore()
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      allowComments: true
    },
    appearance: {
      darkMode: false,
      compactMode: false
    }
  })

  const handleSave = async () => {
    try {
      // 这里应该调用 API 保存设置
      console.log('Settings saved:', settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">请先登录</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面头部 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">设置</h1>
        <p className="text-lg text-gray-600">管理您的账户设置和偏好</p>
      </div>

      <div className="space-y-6">
        {/* 通知设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>通知设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">邮件通知</Label>
                <p className="text-sm text-gray-600">接收重要更新和活动通知</p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: checked }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">推送通知</Label>
                <p className="text-sm text-gray-600">在浏览器中显示推送通知</p>
              </div>
              <Switch
                checked={settings.notifications.push}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push: checked }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">营销邮件</Label>
                <p className="text-sm text-gray-600">接收产品更新和促销信息</p>
              </div>
              <Switch
                checked={settings.notifications.marketing}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, marketing: checked }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 隐私设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>隐私设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">公开个人资料</Label>
                <p className="text-sm text-gray-600">允许其他用户查看您的个人资料</p>
              </div>
              <Switch
                checked={settings.privacy.profileVisible}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, profileVisible: checked }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">显示邮箱</Label>
                <p className="text-sm text-gray-600">在个人资料中显示邮箱地址</p>
              </div>
              <Switch
                checked={settings.privacy.showEmail}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, showEmail: checked }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">允许评论</Label>
                <p className="text-sm text-gray-600">允许其他用户对您的内容发表评论</p>
              </div>
              <Switch
                checked={settings.privacy.allowComments}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, allowComments: checked }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 外观设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>外观设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">深色模式</Label>
                <p className="text-sm text-gray-600">使用深色主题</p>
              </div>
              <Switch
                checked={settings.appearance.darkMode}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, darkMode: checked }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">紧凑模式</Label>
                <p className="text-sm text-gray-600">使用更紧凑的布局</p>
              </div>
              <Switch
                checked={settings.appearance.compactMode}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, compactMode: checked }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>保存设置</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
