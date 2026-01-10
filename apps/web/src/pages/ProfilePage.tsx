import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '../components/ui/input-otp';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuthStore } from '../stores/useAuthStore';
import {
  User,
  Mail,
  Calendar,
  Edit,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image,
} from 'lucide-react';
import { DEFAULT_AVATAR } from '../constants/images';
import { api, getMediaUrl, setAuthToken } from '@whispers/utils';
import {
  MediaPicker,
  type MediaType,
  type MediaItem,
  type MediaSelectResult,
} from '@whispers/ui';

// 更换邮箱步骤
type EmailChangeStep = 'idle' | 'input' | 'verify' | 'success';

const ProfilePage: React.FC = () => {
  const { user, updateUser, accessToken } = useAuthStore();
  const isAdmin = user?.isAdmin || false;
  const [isEditing, setIsEditing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });

  // 媒体选择器状态
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // 更换邮箱相关状态
  const [emailChangeStep, setEmailChangeStep] =
    useState<EmailChangeStep>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 用户名校验状态
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const usernameCheckTimer = useRef<NodeJS.Timeout | null>(null);

  // 检查用户名是否可用（防抖）
  const checkUsername = useCallback(
    (username: string) => {
      // 清除之前的定时器
      if (usernameCheckTimer.current) {
        clearTimeout(usernameCheckTimer.current);
      }

      // 如果用户名没变，不需要检查
      if (username === user?.username) {
        setUsernameStatus('idle');
        setUsernameError(null);
        return;
      }

      // 基本验证
      if (!username || username.trim().length === 0) {
        setUsernameStatus('unavailable');
        setUsernameError('用户名不能为空');
        return;
      }

      if (username.length < 2) {
        setUsernameStatus('unavailable');
        setUsernameError('用户名至少需要2个字符');
        return;
      }

      if (username.length > 20) {
        setUsernameStatus('unavailable');
        setUsernameError('用户名不能超过20个字符');
        return;
      }

      setUsernameStatus('checking');
      setUsernameError(null);

      // 防抖：500ms 后发起请求
      usernameCheckTimer.current = setTimeout(async () => {
        try {
          const response = await api.get('/auth/check-username', {
            params: { username },
          });
          if (response.data?.data?.available) {
            setUsernameStatus('available');
            setUsernameError(null);
          } else {
            setUsernameStatus('unavailable');
            setUsernameError(
              response.data?.data?.message || '该用户名已被使用'
            );
          }
        } catch (err) {
          console.error('Check username failed:', err);
          setUsernameStatus('unavailable');
          setUsernameError('检查用户名失败');
        }
      }, 500);
    },
    [user?.username]
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (usernameCheckTimer.current) {
        clearTimeout(usernameCheckTimer.current);
      }
    };
  }, []);

  // 处理用户名输入变化
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setFormData({ ...formData, username: newUsername });
    checkUsername(newUsername);
  };

  const handleSave = async () => {
    if (!user) return;

    // 如果用户名正在检查或不可用，不允许保存
    if (usernameStatus === 'checking') {
      return;
    }

    if (usernameStatus === 'unavailable') {
      return;
    }

    try {
      const response = await api.patch('/auth/profile', {
        username: formData.username,
        bio: formData.bio,
        avatar: formData.avatar,
      });

      if (response.data?.success) {
        updateUser({ ...user, ...response.data.data });
        setIsEditing(false);
        setUsernameStatus('idle');
        setUsernameError(null);
      }
    } catch (error: unknown) {
      console.error('Failed to update profile:', error);
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message) {
        setUsernameError(err.response.data.message);
        setUsernameStatus('unavailable');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      avatar: user?.avatar || '',
    });
    setIsEditing(false);
    setAvatarError(false);
    setUsernameStatus('idle');
    setUsernameError(null);
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  const getAvatarSrc = () => {
    if (avatarError || !formData.avatar) {
      return DEFAULT_AVATAR;
    }
    return getMediaUrl(formData.avatar);
  };

  // 获取媒体列表（仅图片）
  const fetchMedia = useCallback(
    async (_type: MediaType): Promise<MediaItem[]> => {
      try {
        const token = accessToken || localStorage.getItem('auth_token');
        if (token) {
          setAuthToken(token);
        }

        const params: Record<string, string> = {};
        // 头像只需要图片类型
        params.type = 'image/';
        // 管理员可以查看所有用户的文件
        if (isAdmin) {
          params.all = 'true';
        }

        const response = await api.get('/media', { params });
        if (response.data?.success) {
          return response.data.data.items || [];
        }
        return [];
      } catch {
        return [];
      }
    },
    [accessToken, isAdmin]
  );

  // 上传文件
  const uploadAvatarFile = useCallback(
    async (file: File): Promise<string> => {
      const token = accessToken || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未登录');
      }
      setAuthToken(token);

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await api.post('/media/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success && response.data.data?.url) {
        return response.data.data.url;
      }
      throw new Error('上传失败');
    },
    [accessToken]
  );

  // 处理媒体选择
  const handleMediaSelect = useCallback((result: MediaSelectResult) => {
    setFormData(prev => ({ ...prev, avatar: result.url }));
    setAvatarError(false);
    setMediaPickerOpen(false);
  }, []);

  // 打开媒体选择器
  const handleOpenMediaPicker = useCallback(() => {
    setMediaPickerOpen(true);
  }, []);

  // 开始更换邮箱流程
  const handleStartEmailChange = () => {
    setEmailChangeStep('input');
    setNewEmail('');
    setVerifyCode('');
    setEmailError(null);
  };

  // 取消更换邮箱
  const handleCancelEmailChange = () => {
    setEmailChangeStep('idle');
    setNewEmail('');
    setVerifyCode('');
    setEmailError(null);
  };

  // 验证邮箱格式
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 发送验证码
  const handleSendVerifyCode = async () => {
    if (!newEmail) {
      setEmailError('请输入新邮箱地址');
      return;
    }

    if (!isValidEmail(newEmail)) {
      setEmailError('请输入有效的邮箱地址');
      return;
    }

    if (newEmail === user?.email) {
      setEmailError('新邮箱不能与当前邮箱相同');
      return;
    }

    try {
      setEmailLoading(true);
      setEmailError(null);

      const response = await api.post('/auth/send-email-change-code', {
        newEmail,
      });

      if (response.data?.success) {
        setEmailChangeStep('verify');
        // 开始倒计时 60 秒
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setEmailError(response.data?.message || '发送验证码失败');
      }
    } catch (err: unknown) {
      console.error('Failed to send verify code:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setEmailError(
        error.response?.data?.message || '发送验证码失败，请稍后重试'
      );
    } finally {
      setEmailLoading(false);
    }
  };

  // 确认更换邮箱
  const handleConfirmEmailChange = async () => {
    if (!verifyCode) {
      setEmailError('请输入验证码');
      return;
    }

    if (verifyCode.length !== 6) {
      setEmailError('验证码应为6位数字');
      return;
    }

    try {
      setEmailLoading(true);
      setEmailError(null);

      const response = await api.post('/auth/change-email', {
        newEmail,
        code: verifyCode,
      });

      if (response.data?.success && user) {
        // 更新本地用户信息
        updateUser({ ...user, email: newEmail } as typeof user);
        setEmailChangeStep('success');
        // 3秒后关闭
        setTimeout(() => {
          setEmailChangeStep('idle');
        }, 3000);
      } else {
        setEmailError(response.data?.message || '更换邮箱失败');
      }
    } catch (err: unknown) {
      console.error('Failed to change email:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setEmailError(
        error.response?.data?.message || '更换邮箱失败，请稍后重试'
      );
    } finally {
      setEmailLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">请先登录</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面头部 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">个人资料</h1>
        <p className="text-lg text-muted-foreground">
          管理您的个人信息和账户设置
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 头像和基本信息 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>基本信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像 */}
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={getAvatarSrc()}
                    alt={user.username}
                    className="h-32 w-32 rounded-full object-cover border-4 border-border"
                    onError={handleAvatarError}
                  />
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      onClick={handleOpenMediaPicker}
                      title="选择头像"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* 用户信息 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    注册时间: {new Date().toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>详细信息</CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>编辑</span>
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>取消</span>
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>保存</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                {isEditing ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={handleUsernameChange}
                        placeholder="请输入用户名"
                        className={
                          usernameStatus === 'unavailable'
                            ? 'border-destructive pr-10'
                            : usernameStatus === 'available'
                              ? 'border-green-500 pr-10'
                              : ''
                        }
                      />
                      {/* 校验状态图标 */}
                      {usernameStatus === 'checking' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {usernameStatus === 'available' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                      {usernameStatus === 'unavailable' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                    </div>
                    {/* 错误提示 */}
                    {usernameError && (
                      <p className="text-xs text-destructive">
                        {usernameError}
                      </p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="text-xs text-green-500">用户名可用</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formData.username || '未设置'}
                  </div>
                )}
              </div>

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>

                {emailChangeStep === 'idle' && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-md text-muted-foreground">
                      {user.email || '未设置'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEmailChange}
                    >
                      更换邮箱
                    </Button>
                  </div>
                )}

                {emailChangeStep === 'input' && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      当前邮箱：
                      <span className="text-foreground">{user.email}</span>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">新邮箱地址</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="请输入新邮箱地址"
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSendVerifyCode}
                        disabled={emailLoading}
                      >
                        {emailLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            发送中...
                          </>
                        ) : (
                          '发送验证码'
                        )}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEmailChange}>
                        取消
                      </Button>
                    </div>
                  </div>
                )}

                {emailChangeStep === 'verify' && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      验证码已发送至：
                      <span className="text-foreground">{newEmail}</span>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="verifyCode">验证码</Label>
                      <InputOTP
                        maxLength={6}
                        value={verifyCode}
                        onChange={value => setVerifyCode(value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleConfirmEmailChange}
                        disabled={emailLoading}
                      >
                        {emailLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            验证中...
                          </>
                        ) : (
                          '确认更换'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSendVerifyCode}
                        disabled={countdown > 0 || emailLoading}
                      >
                        {countdown > 0
                          ? `重新发送 (${countdown}s)`
                          : '重新发送'}
                      </Button>
                      <Button variant="ghost" onClick={handleCancelEmailChange}>
                        取消
                      </Button>
                    </div>
                  </div>
                )}

                {emailChangeStep === 'success' && (
                  <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>邮箱更换成功！</span>
                  </div>
                )}
              </div>

              {/* 个人简介 */}
              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={e =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="介绍一下自己..."
                    rows={4}
                  />
                ) : (
                  <div className="p-3 bg-muted rounded-md min-h-[100px]">
                    {formData.bio || '这个人很懒，什么都没有留下...'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 媒体选择器 */}
      <MediaPicker
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        type="image"
        fetchMedia={fetchMedia}
        uploadFile={uploadAvatarFile}
        title="选择头像"
      />
    </div>
  );
};

export default ProfilePage;
