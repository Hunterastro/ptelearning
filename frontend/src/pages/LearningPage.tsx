import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Space,
  Progress,
  Row,
  Col,
  Spin,
  Alert,
  Radio,
  Tag,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  QuestionOutlined,
  BookOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { wordlistApi, learningApi } from '../services/api';
import { Wordlist, Word } from '../types/wordlist';

const { Title, Text, Paragraph } = Typography;

const LearningPage: React.FC = () => {
  const { wordlistId } = useParams<{ wordlistId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wordlist, setWordlist] = useState<Wordlist | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<'know' | 'vague' | 'unknown' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [learningSession, setLearningSession] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // 初始化学习会话
  const initializeLearning = async () => {
    if (!wordlistId) return;

    try {
      setLoading(true);
      
      // 获取词汇表信息
      const wordlistResponse = await wordlistApi.getWordlist(wordlistId);
      setWordlist(wordlistResponse.data);

      // 开始学习会话
      const sessionResponse = await learningApi.startLearning(wordlistId, {
        wordlistId,
        studyMode: 'normal',
        isFirstTime: true
      });
      setLearningSession(sessionResponse.data);

      // 获取初始单词（随机顺序）
      await loadNextWords();

    } catch (error: any) {
      console.error('初始化学习失败:', error);
      message.error('学习会话初始化失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载下一批单词
  const loadNextWords = async (mode: 'new' | 'random' | 'review' = 'random') => {
    if (!wordlistId) return;

    try {
      const response = await learningApi.getNextWords(wordlistId, {
        mode,
        count: 10 // 一次获取10个单词
      });

      const newWords = response.data.words || [];
      if (newWords.length > 0) {
        setWords(newWords);
        setCurrentWordIndex(0);
        setHasMore(response.data.hasMore);
        setProgress(prev => ({
          ...prev,
          total: prev.total + newWords.length
        }));
      } else {
        setHasMore(false);
        if (mode === 'random') {
          // 如果随机模式没有更多单词，尝试新单词模式
          loadNextWords('new');
        } else {
          message.info('恭喜！您已完成所有可学习的单词');
          navigate('/progress');
        }
      }
    } catch (error: any) {
      console.error('加载单词失败:', error);
      message.error('加载学习内容失败');
    }
  };

  useEffect(() => {
    initializeLearning();
  }, [wordlistId]);

  const currentWord = words[currentWordIndex];

  const handleAnswer = (answer: 'know' | 'vague' | 'unknown') => {
    setSelectedAnswer(answer);
    setShowResult(true);
  };

  const handleNext = async () => {
    if (!currentWord || !selectedAnswer) return;

    try {
      setSubmitting(true);
      
      // 提交学习结果到后端
      await learningApi.submitAnswer(wordlistId!, currentWord._id, {
        choice: selectedAnswer,
        studyTime: 30, // 假设每个单词学习30秒
        reviewTime: showResult ? 10 : 0
      });

      // 更新本地进度
      setProgress(prev => ({ 
        ...prev, 
        completed: prev.completed + 1 
      }));

      // 移动到下一个单词
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // 当前批次完成，加载新单词
        if (hasMore) {
          await loadNextWords();
          setSelectedAnswer(null);
          setShowResult(false);
        } else {
          // 学习完成
          message.success('恭喜完成学习！');
          navigate('/progress');
        }
      }
    } catch (error: any) {
      console.error('提交学习结果失败:', error);
      message.error('保存学习进度失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/wordlists');
  };

  const handleRefreshWords = () => {
    loadNextWords('random');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!wordlist || words.length === 0) {
    return (
      <Alert
        message="词汇表暂无可学习内容"
        description="请联系管理员添加单词内容，或尝试刷新获取新的学习内容"
        type="warning"
        action={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefreshWords}>
              刷新内容
            </Button>
            <Button onClick={handleBack}>返回词汇表</Button>
          </Space>
        }
      />
    );
  }

  return (
    <div>
      {/* 顶部导航和进度 */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                返回
              </Button>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {wordlist.name}
                </Title>
                <Text type="secondary">
                  当前批次: {currentWordIndex + 1} / {words.length} | 
                  总进度: {progress.completed} 个单词已学习
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefreshWords}
                title="获取新的随机单词"
              >
                换一批
              </Button>
              <Progress
                percent={words.length > 0 ? Math.round(((currentWordIndex + 1) / words.length) * 100) : 0}
                style={{ width: 200 }}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 学习卡片 */}
      {currentWord && (
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12}>
            <Card
              style={{
                textAlign: 'center',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 单词显示 */}
                <div>
                  <Title level={2} style={{ color: '#1890ff', marginBottom: 16 }}>
                    {currentWord.phrase}
                  </Title>
                  
                  {!showResult ? (
                    <Paragraph style={{ fontSize: '16px', color: '#666' }}>
                      您是否认识这个单词/短语？
                    </Paragraph>
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                        <Text strong style={{ fontSize: '16px' }}>
                          释义：{currentWord.meaning}
                        </Text>
                      </div>
                      
                      <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                        <Text style={{ fontSize: '14px' }}>
                          <strong>例句：</strong>{currentWord.example}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                          <strong>翻译：</strong>{currentWord.translation}
                        </Text>
                      </div>

                      <Tag color={
                        selectedAnswer === 'know' ? 'green' :
                        selectedAnswer === 'vague' ? 'orange' : 'red'
                      }>
                        您选择了: {
                          selectedAnswer === 'know' ? '认识' :
                          selectedAnswer === 'vague' ? '模糊' : '不认识'
                        }
                      </Tag>
                    </Space>
                  )}
                </div>

                {/* 操作按钮 */}
                {!showResult ? (
                  <Space size="large">
                    <Button
                      type="primary"
                      size="large"
                      icon={<CheckOutlined />}
                      onClick={() => handleAnswer('know')}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                      认识
                    </Button>
                    <Button
                      size="large"
                      icon={<QuestionOutlined />}
                      onClick={() => handleAnswer('vague')}
                      style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }}
                    >
                      模糊
                    </Button>
                    <Button
                      size="large"
                      icon={<CloseOutlined />}
                      onClick={() => handleAnswer('unknown')}
                      danger
                    >
                      不认识
                    </Button>
                  </Space>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleNext}
                    loading={submitting}
                    style={{ minWidth: '120px' }}
                  >
                    {currentWordIndex < words.length - 1 || hasMore ? '下一个' : '完成学习'}
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default LearningPage; 