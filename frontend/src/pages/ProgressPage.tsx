import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Empty, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Table, 
  Button, 
  Tag, 
  Space,
  message,
  Spin
} from 'antd';
import { 
  TrophyOutlined, 
  BookOutlined, 
  FireOutlined, 
  ClockCircleOutlined,
  ReloadOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { learningApi } from '../services/api';

const { Title, Paragraph } = Typography;

interface ProgressData {
  totalWords: number;
  newWords: number;
  learningWords: number;
  familiarWords: number;
  masteredWords: number;
  reviewWords: number;
  completionRate: number;
  averageScore: number;
  totalStudyTime: number;
  isCompleted: boolean;
  startedAt: Date;
  lastStudied: Date;
}

interface WordlistProgress {
  _id: string;
  wordlistId: {
    _id: string;
    name: string;
    category: string;
    difficulty: string;
    wordCount: number;
  };
  progress: ProgressData;
  lastStudied: Date;
}

const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressList, setProgressList] = useState<WordlistProgress[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalWords: 0,
    streak: 0,
    accuracy: 0,
    studyTime: 0,
    totalWordlists: 0,
    completedWordlists: 0,
  });

  // 获取学习进度数据
  const fetchProgressData = async () => {
    try {
      const [progressResponse, statsResponse] = await Promise.all([
        learningApi.getAllProgress({ limit: 50 }),
        learningApi.getStats()
      ]);

      const progressData = progressResponse.data.progressList || [];
      setProgressList(progressData);

      // 计算总体统计
      const totalWordsLearned = progressData.reduce((sum: number, p: any) => 
        sum + (p.progress?.totalWords || 0), 0);
      const totalStudyTime = progressData.reduce((sum: number, p: any) => 
        sum + (p.progress?.totalStudyTime || 0), 0);
      const completedCount = progressData.filter((p: any) => 
        p.progress?.isCompleted).length;
      const avgAccuracy = progressData.length > 0 
        ? Math.round(progressData.reduce((sum: number, p: any) => 
            sum + (p.progress?.averageScore || 0), 0) / progressData.length)
        : 0;

      setOverallStats({
        totalWords: totalWordsLearned,
        streak: statsResponse.data?.currentStreak || 0,
        accuracy: avgAccuracy,
        studyTime: totalStudyTime,
        totalWordlists: progressData.length,
        completedWordlists: completedCount,
      });
    } catch (error: any) {
      console.error('获取学习进度失败:', error);
      message.error('加载学习进度失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProgressData();
  };

  const handleContinueLearning = (wordlistId: string) => {
    navigate(`/learning/${wordlistId}`);
  };

  // 表格列定义
  const columns = [
    {
      title: '词汇表',
      dataIndex: ['wordlistId', 'name'],
      key: 'name',
      render: (name: string, record: WordlistProgress) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.wordlistId.category} • {record.wordlistId.difficulty}
          </div>
        </div>
      ),
    },
    {
      title: '学习进度',
      key: 'progress',
      render: (_: any, record: WordlistProgress) => {
        const progress = record.progress;
        return (
          <div>
            <Progress 
              percent={progress?.completionRate || 0} 
              size="small" 
              status={progress?.isCompleted ? 'success' : 'active'}
            />
            <div style={{ fontSize: '12px', marginTop: 4 }}>
              {progress?.totalWords || 0} 个单词 • 
              准确率 {progress?.averageScore || 0}%
            </div>
          </div>
        );
      },
    },
    {
      title: '学习状态',
      key: 'status',
      render: (_: any, record: WordlistProgress) => {
        const progress = record.progress;
        return (
          <Space direction="vertical" size="small">
            <Tag color="blue">新单词: {progress?.newWords || 0}</Tag>
            <Tag color="orange">学习中: {progress?.learningWords || 0}</Tag>
            <Tag color="green">已掌握: {progress?.masteredWords || 0}</Tag>
          </Space>
        );
      },
    },
    {
      title: '最后学习',
      dataIndex: 'lastStudied',
      key: 'lastStudied',
      render: (date: string) => {
        if (!date) return '-';
        const lastStudied = new Date(date);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - lastStudied.getTime()) / (1000 * 60 * 60));
        
        if (diffHours < 1) return '刚刚';
        if (diffHours < 24) return `${diffHours}小时前`;
        return `${Math.floor(diffHours / 24)}天前`;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: WordlistProgress) => (
        <Button 
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleContinueLearning(record.wordlistId._id)}
        >
          {record.progress?.isCompleted ? '复习' : '继续学习'}
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>学习进度</Title>
          <Paragraph>跟踪您的英语学习成果</Paragraph>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={refreshing}
        >
          刷新数据
        </Button>
      </div>

      {/* 总体统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已学单词"
              value={overallStats.totalWords}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="连续天数"
              value={overallStats.streak}
              suffix="天"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="学习准确率"
              value={overallStats.accuracy}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress percent={overallStats.accuracy} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="学习时长"
              value={Math.floor(overallStats.studyTime / 60)}
              suffix="小时"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 词汇表进度统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="学习中的词汇表"
              value={overallStats.totalWordlists}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title="已完成的词汇表"
              value={overallStats.completedWordlists}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细进度表格 */}
      <Card title="词汇表进度详情">
        {progressList.length > 0 ? (
          <Table
            columns={columns}
            dataSource={progressList}
            rowKey="_id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个词汇表`
            }}
          />
                 ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Empty description="您还没有开始学习任何词汇表" />
            <Button 
              type="primary" 
              onClick={() => navigate('/wordlists')}
              style={{ marginTop: 16 }}
            >
              浏览词汇表
            </Button>
          </div>
         )}
      </Card>
    </div>
  );
};

export default ProgressPage; 