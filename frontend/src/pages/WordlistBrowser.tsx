import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Empty, Space, List, Tag, Row, Col, Spin } from 'antd';
import { BookOutlined, PlusOutlined, PlayCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { wordlistApi } from '../services/api';
import { Wordlist } from '../types/wordlist';

const { Title, Paragraph, Text } = Typography;

const WordlistBrowser: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wordlists, setWordlists] = useState<Wordlist[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取词汇表列表
  const fetchWordlists = async () => {
    try {
      setLoading(true);
      const response = await wordlistApi.getWordlists();
      setWordlists(response.data.wordlists || []);
    } catch (error) {
      console.error('获取词汇表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWordlists();
  }, []);

  const handleUploadClick = () => {
    navigate('/admin');
  };

  const handleStartLearning = (wordlistId: string) => {
    navigate(`/learning/${wordlistId}`);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>词汇表浏览</Title>
        <Paragraph>选择一个词汇表开始您的英语学习之旅</Paragraph>
      </div>

      {user?.role === 'admin' && (
        <Card style={{ marginBottom: 24, borderColor: '#faad14' }}>
          <Space>
            <PlusOutlined style={{ fontSize: 24, color: '#faad14' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>管理员功能</Title>
              <Paragraph style={{ margin: 0 }}>
                您可以上传新的词汇表Excel文件，管理现有词汇表内容
              </Paragraph>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleUploadClick}>
              上传词汇表
            </Button>
          </Space>
        </Card>
      )}

      <Spin spinning={loading}>
        {wordlists.length === 0 ? (
          <Empty
            image={<BookOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description={
              <span>
                暂无词汇表<br/>
                {user?.role === 'admin' ? '请先上传一个Excel词汇表文件' : '管理员还未上传词汇表'}
              </span>
            }
            style={{ padding: '60px 0' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {wordlists.map((wordlist) => (
              <Col xs={24} sm={12} lg={8} key={wordlist._id}>
                <Card
                  hoverable
                  actions={[
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleStartLearning(wordlist._id)}
                      block
                    >
                      开始学习
                    </Button>
                  ]}
                >
                  <Card.Meta
                    avatar={<BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={wordlist.name}
                    description={
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {wordlist.description && (
                          <Text type="secondary">{wordlist.description}</Text>
                        )}
                        
                        <Space wrap>
                          <Tag color="blue">{wordlist.category}</Tag>
                          <Tag color={
                            wordlist.difficulty === 'Beginner' ? 'green' :
                            wordlist.difficulty === 'Intermediate' ? 'orange' : 'red'
                          }>
                            {wordlist.difficulty === 'Beginner' ? '初级' :
                             wordlist.difficulty === 'Intermediate' ? '中级' : '高级'}
                          </Tag>
                        </Space>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>{wordlist.wordCount} 个单词</Text>
                          <Text type="secondary">
                            <UserOutlined /> {wordlist.createdBy.username}
                          </Text>
                        </div>

                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          上传于 {new Date(wordlist.uploadDate).toLocaleDateString('zh-CN')}
                        </Text>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default WordlistBrowser; 