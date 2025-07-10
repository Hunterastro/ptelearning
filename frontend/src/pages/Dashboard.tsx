import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Button, Space, Divider, List, Progress } from 'antd';
import {
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FireOutlined,
  PlusOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { wordlistApi, learningApi } from '../services/api';
import { Wordlist } from '../types/wordlist';

const { Title, Text, Paragraph } = Typography;

interface DashboardStats {
  totalWordlists: number;
  wordsLearned: number;
  studyStreak: number;
  todayGoal: number;
  todayProgress: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalWordlists: 0,
    wordsLearned: 0,
    studyStreak: 0,
    todayGoal: 20,
    todayProgress: 0,
  });
  const [recentWordlists, setRecentWordlists] = useState<Wordlist[]>([]);

  // 获取仪表板数据
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取词汇表列表
      const wordlistsResponse = await wordlistApi.getWordlists({ limit: 5 });
      const wordlists = wordlistsResponse.data.wordlists || [];
      setRecentWordlists(wordlists);
      
      // 获取学习统计
      try {
        const learningStatsResponse = await learningApi.getStats();
        const learningStats = learningStatsResponse.data;
        
        setStats({
          totalWordlists: wordlists.length,
          wordsLearned: learningStats.totalWordsLearned || 0,
          studyStreak: learningStats.studyStreak || 0,
          todayGoal: 20,
          todayProgress: learningStats.todayProgress || 0,
        });
      } catch (error) {
        // 如果学习统计API失败，使用基本统计
        setStats(prev => ({
          ...prev,
          totalWordlists: wordlists.length,
        }));
      }
      
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      // 保持默认值
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: '浏览词汇表',
      description: '选择一个词汇表开始学习',
      icon: <BookOutlined />,
      action: () => navigate('/wordlists'),
    },
    {
      title: '查看学习进度',
      description: '查看您的详细学习统计',
      icon: <TrophyOutlined />,
      action: () => navigate('/progress'),
    },
    {
      title: '个人设置',
      description: '管理您的学习偏好',
      icon: <FireOutlined />,
      action: () => navigate('/profile'),
    },
  ];

  return (
    <div>
      {/* 欢迎区域 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          欢迎回来，{user?.username}！ 👋
        </Title>
        <Paragraph>
          今天是学习的好日子，让我们继续提升您的英语水平吧！
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="词汇表数量"
              value={stats.totalWordlists}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已学单词"
              value={stats.wordsLearned}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="连续学习"
              value={stats.studyStreak}
              suffix="天"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="今日目标"
              value={`${stats.todayProgress}/${stats.todayGoal}`}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress
              percent={(stats.todayProgress / stats.todayGoal) * 100}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近的词汇表 */}
        <Col xs={24} lg={12}>
          <Card
            title="最近学习的词汇表"
            extra={
              <Button type="text" onClick={() => navigate('/wordlists')}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentWordlists}
              loading={loading}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => navigate(`/learning/${item._id}`)}
                    >
                      开始学习
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space direction="vertical" size={4}>
                        <Text type="secondary">{`${item.wordCount} 个单词`}</Text>
                        <Text type="secondary">
                          {`难度: ${item.difficulty === 'Beginner' ? '初级' : 
                                  item.difficulty === 'Intermediate' ? '中级' : '高级'}`}
                        </Text>
                        <Text type="secondary">
                          {`分类: ${item.category}`}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card title="快速操作">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  size="small"
                  hoverable
                  onClick={action.action}
                  style={{ cursor: 'pointer' }}
                >
                  <Space>
                    <div style={{ fontSize: '24px', color: '#1890ff' }}>
                      {action.icon}
                    </div>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>
                        {action.title}
                      </Title>
                      <Text type="secondary">{action.description}</Text>
                    </div>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 学习提示 */}
      <Card style={{ marginTop: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ color: 'white' }}>
          <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
            💡 学习小贴士
          </Title>
          <Paragraph style={{ color: 'white', marginBottom: 16 }}>
            持续的学习比一次性的大量学习更有效。建议每天至少学习20个新单词，并复习之前学过的内容。
          </Paragraph>
          <Button type="primary" ghost onClick={() => navigate('/wordlists')}>
            开始今天的学习
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard; 