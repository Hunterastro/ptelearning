import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Upload,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Space,
  Popconfirm,
  Typography,
  Statistic,
  Row,
  Col,
  Tag,
  Divider
} from 'antd';
import {
  UploadOutlined,
  UserOutlined,
  BookOutlined,
  DeleteOutlined,
  EyeOutlined,
  CrownOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userApi, wordlistApi } from '../services/api';
import { Wordlist } from '../types/wordlist';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [wordlists, setWordlists] = useState<Wordlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWordlists: 0,
    totalWords: 0,
    activeUsers: 0
  });

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers();
      setUsers(response.data.users || []);
    } catch (error: any) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取词汇表列表
  const fetchWordlists = async () => {
    try {
      setLoading(true);
      const response = await wordlistApi.getWordlists();
      setWordlists(response.data.wordlists || []);
    } catch (error: any) {
      console.error('获取词汇表列表失败:', error);
      message.error('获取词汇表列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取系统统计
  const fetchStats = async () => {
    try {
      const response = await userApi.getSystemStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchUsers();
    fetchWordlists();
    fetchStats();
  }, []);

  // 更新用户角色
  const updateUserRole = async (userId: string, role: string) => {
    try {
      await userApi.updateUserRole(userId, { role });
      message.success('用户角色更新成功');
      fetchUsers();
    } catch (error: any) {
      message.error('更新用户角色失败');
    }
  };

  // 更新用户状态
  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await userApi.updateUserStatus(userId, { isActive });
      message.success(`用户已${isActive ? '激活' : '禁用'}`);
      fetchUsers();
    } catch (error: any) {
      message.error('更新用户状态失败');
    }
  };

  // 删除词汇表
  const deleteWordlist = async (wordlistId: string) => {
    try {
      await wordlistApi.deleteWordlist(wordlistId);
      message.success('词汇表删除成功');
      fetchWordlists();
      fetchStats();
    } catch (error: any) {
      message.error('删除词汇表失败');
    }
  };

  // 文件上传处理
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('wordlist', file);

    try {
      setLoading(true);
      const response = await wordlistApi.uploadWordlist(file);
      
      if (response.data.success) {
        message.success('词汇表上传成功！');
        setUploadModalVisible(false);
        fetchWordlists();
        fetchStats();
      } else {
        message.error(response.data.message || '上传失败');
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('文件上传失败，请检查文件格式');
      }
    } finally {
      setLoading(false);
    }
    
    return false; // 阻止默认上传行为
  };

  // 用户表格列定义
  const userColumns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: User) => (
        <Space>
          <UserOutlined />
          {text}
          {record.role === 'admin' && <CrownOutlined style={{ color: '#faad14' }} />}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'gold' : 'blue'}>
          {role === 'admin' ? '管理员' : '用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '激活' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string) => date ? new Date(date).toLocaleDateString('zh-CN') : '从未登录',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: User) => (
        <Space>
          <Button
            size="small"
            onClick={() => updateUserRole(record._id, record.role === 'admin' ? 'user' : 'admin')}
          >
            {record.role === 'admin' ? '设为用户' : '设为管理员'}
          </Button>
          <Button
            size="small"
            type={record.isActive ? 'default' : 'primary'}
            onClick={() => updateUserStatus(record._id, !record.isActive)}
          >
            {record.isActive ? '禁用' : '激活'}
          </Button>
        </Space>
      ),
    },
  ];

  // 词汇表表格列定义
  const wordlistColumns: ColumnsType<Wordlist> = [
    {
      title: '词汇表名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <BookOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '单词数量',
      dataIndex: 'wordCount',
      key: 'wordCount',
      render: (count: number) => <Text strong>{count}</Text>,
    },
    {
      title: '上传时间',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Wordlist) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}>
            查看
          </Button>
          <Popconfirm
            title="确定删除这个词汇表吗？"
            onConfirm={() => deleteWordlist(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>管理员面板</Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="词汇表数量"
              value={stats.totalWordlists}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总单词数"
              value={stats.totalWords}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Tabs 
        defaultActiveKey="users"
        items={[
          {
            key: "users",
            label: "用户管理",
            children: (
              <Card
                title="用户列表"
                extra={
                  <Button onClick={fetchUsers} loading={loading}>
                    刷新
                  </Button>
                }
              >
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个用户`,
                  }}
                />
              </Card>
            )
          },
          {
            key: "wordlists",
            label: "词汇表管理",
            children: (
              <Card
                title="词汇表列表"
                extra={
                  <Space>
                    <Button onClick={fetchWordlists} loading={loading}>
                      刷新
                    </Button>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => setUploadModalVisible(true)}
                    >
                      上传词汇表
                    </Button>
                  </Space>
                }
              >
                <Table
                  columns={wordlistColumns}
                  dataSource={wordlists}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个词汇表`,
                  }}
                />
              </Card>
            )
          }
        ]}
      />

      {/* 上传词汇表模态框 */}
      <Modal
        title="上传词汇表"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <div style={{ padding: '20px 0' }}>
          <Text strong>文件格式要求：</Text>
          <ul style={{ marginTop: 8, marginBottom: 16 }}>
            <li>支持 .xlsx, .xls, .csv 格式</li>
            <li>第1列：Collocation（搭配词）</li>
            <li>第2列：Sentence（例句）</li>
            <li>第3列：Meaning（英文释义）</li>
            <li>第4列：中文翻译</li>
          </ul>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 12 }}>
            💡 系统将自动映射：搭配词→短语，例句→示例，英文释义→说明，中文翻译→释义
          </Text>
          
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            beforeUpload={handleUpload}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">
              点击或拖拽文件到此区域上传
            </p>
            <p className="ant-upload-hint">
              支持Excel和CSV格式文件
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel; 