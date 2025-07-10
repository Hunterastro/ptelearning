import React from 'react';
import { Spin } from 'antd';

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  background: '#f5f5f5'
};

const loadingContentStyle: React.CSSProperties = {
  textAlign: 'center'
};

const loadingTextStyle: React.CSSProperties = {
  marginTop: '16px',
  color: '#666',
  fontSize: '16px'
};

const Loading: React.FC<{ tip?: string }> = ({ tip = '加载中...' }) => {
  return (
    <div style={loadingContainerStyle}>
      <div style={loadingContentStyle}>
        <Spin size="large" />
        <p style={loadingTextStyle}>{tip}</p>
      </div>
    </div>
  );
};

export default Loading; 