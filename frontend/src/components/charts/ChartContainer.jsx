import React from 'react';
import { Card } from 'antd';

const ChartContainer = ({ title, children, ...props }) => {
  return (
    <Card title={title} {...props}>
      {children}
    </Card>
  );
};

export default ChartContainer;




