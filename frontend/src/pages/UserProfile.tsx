import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Avatar, 
  Divider, 
  Switch, 
  InputNumber,
  Select,
  TimePicker,
  Row,
  Col,
  message,
  Tabs
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  AimOutlined,
  SettingOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import { userApi, authApi } from '../services/api';
import { UserPreferences } from '../types/user';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    dailyGoal: 20,
    reviewInterval: 24,
    difficulty: 'medium',
    studyReminder: true,
    reviewReminder: true,
    studyReportEmail: false,
    reminderTime: '19:00',
    preferredCategories: [],
    autoPlay: false,
    studyMode: 'normal'
  });

  // 加载用户偏好设置
  const loadPreferences = async () => {
    try {
      const response = await userApi.getPreferences();
      const userPrefs = response.data.preferences || {};
      
      // 合并默认值和用户偏好
      const mergedPrefs = {
        dailyGoal: userPrefs.dailyGoal || 20,
        reviewInterval: userPrefs.reviewInterval || 24,
        difficulty: userPrefs.difficulty || 'medium',
        studyReminder: userPrefs.studyReminder ?? true,
        reviewReminder: userPrefs.reviewReminder ?? true,
        studyReportEmail: userPrefs.studyReportEmail ?? false,
        reminderTime: userPrefs.reminderTime || '19:00',
        preferredCategories: userPrefs.preferredCategories || [],
        autoPlay: userPrefs.autoPlay ?? false,
        studyMode: userPrefs.studyMode || 'normal'
      };
      
      setPreferences(mergedPrefs);
      preferencesForm.setFieldsValue({
        ...mergedPrefs,
        reminderTime: mergedPrefs.reminderTime ? dayjs(mergedPrefs.reminderTime, 'HH:mm') : dayjs('19:00', 'HH:mm')
      });
    } catch (error) {
      console.error('加载偏好设置失败:', error);
      // 使用默认值
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  // 更新个人信息
  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      await authApi.updateProfile(values);
      message.success('个人信息更新成功');
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新偏好设置
  const handleUpdatePreferences = async (values: any) => {
    try {
      setPreferencesLoading(true);
      const updatedPrefs = {
        ...values,
        reminderTime: values.reminderTime ? values.reminderTime.format('HH:mm') : '19:00'
      };
      
      await userApi.updatePreferences(updatedPrefs);
      setPreferences(updatedPrefs);
      message.success('学习偏好更新成功');
    } catch (error: any) {
      message.error(error.message || '更新失败');
    } finally {
      setPreferencesLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      await authApi.updatePassword(values);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  const profileContent = (
    <div>
      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar size={64} icon={<UserOutlined />} style={{ marginRight: 16 }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>{user?.username}</Title>
              <Paragraph style={{ margin: 0, color: '#666' }}>
                {user?.email}
              </Paragraph>
              {user?.role === 'admin' && (
                <Paragraph style={{ margin: 0, color: '#faad14' }}>
                  👑 管理员
                </Paragraph>
              )}
            </div>
          </div>
        </Space>
      </Card>

      {/* 账号设置 */}
      <Card title="账号设置">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={{
            username: user?.username,
            email: user?.email,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱地址"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存个人信息
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 修改密码 */}
      <Card title="安全设置">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="当前密码"
                name="currentPassword"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const preferencesContent = (
    <div>
      {/* 学习目标 */}
      <Card title={<><AimOutlined /> 学习目标</>} style={{ marginBottom: 24 }}>
        <Form
          form={preferencesForm}
          layout="vertical"
          onFinish={handleUpdatePreferences}
          initialValues={preferences}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="每日学习目标（单词数）"
                name="dailyGoal"
                tooltip="设置每天想要学习的单词数量"
              >
                <InputNumber
                  min={5}
                  max={200}
                  style={{ width: '100%' }}
                  addonAfter="个单词"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="学习模式"
                name="studyMode"
                tooltip="选择适合你的学习强度"
              >
                <Select>
                  <Option value="relaxed">轻松模式 - 更多时间思考</Option>
                  <Option value="normal">标准模式 - 正常学习节奏</Option>
                  <Option value="challenge">挑战模式 - 快速学习</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="偏好学习类别"
            name="preferredCategories"
            tooltip="选择你最感兴趣的学习类别"
          >
            <Select 
              mode="multiple" 
              placeholder="选择偏好的学习类别"
              style={{ width: '100%' }}
            >
              <Option value="PTE">PTE Academic</Option>
              <Option value="IELTS">IELTS</Option>
              <Option value="TOEFL">TOEFL</Option>
              <Option value="Business">商务英语</Option>
              <Option value="Academic">学术英语</Option>
              <Option value="General">通用英语</Option>
            </Select>
          </Form.Item>

          <Divider />

          {/* 提醒设置 */}
          <Title level={4}>提醒设置</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="学习提醒时间"
                name="reminderTime"
                tooltip="设置每天的学习提醒时间"
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  placeholder="选择提醒时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item name="studyReminder" valuePropName="checked">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>每日学习提醒</span>
                    <Switch />
                  </div>
                </Form.Item>
                <Form.Item name="reviewReminder" valuePropName="checked">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>复习提醒</span>
                    <Switch />
                  </div>
                </Form.Item>
                <Form.Item name="studyReportEmail" valuePropName="checked">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>学习报告邮件</span>
                    <Switch />
                  </div>
                </Form.Item>
              </Space>
            </Col>
          </Row>

          <Divider />

          {/* 学习偏好 */}
          <Title level={4}>学习偏好</Title>
          <Form.Item name="autoPlay" valuePropName="checked">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div>自动播放发音</div>
                <Paragraph type="secondary" style={{ margin: 0, fontSize: '12px' }}>
                  学习单词时自动播放发音
                </Paragraph>
              </div>
              <Switch />
            </div>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={preferencesLoading}
              icon={<SettingOutlined />}
            >
              保存学习偏好
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>个人设置</Title>
        <Paragraph>管理您的账号信息和学习偏好</Paragraph>
      </div>

      <Tabs
        defaultActiveKey="profile"
        items={[
          {
            key: 'profile',
            label: '个人信息',
            children: profileContent,
            icon: <UserOutlined />
          },
          {
            key: 'preferences',
            label: '学习偏好',
            children: preferencesContent,
            icon: <AimOutlined />
          }
        ]}
      />
    </div>
  );
};

export default UserProfile; 