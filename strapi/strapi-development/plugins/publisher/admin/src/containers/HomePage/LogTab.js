import React from 'react';
import { Text, Padded, Separator } from '@buffetjs/core';

const LogTab = () => {
  return (
      <div>
        <div style={{ backgroundColor: '#007EFF', padding: 10 }}>
          <Text>First block</Text>
        </div>
        <Padded top bottom size="xs">
          <Separator label={text('Separator label', 'or')} />
        </Padded>
        <div style={{ backgroundColor: '#E6F0FB', padding: 10 }}>
          <Text>Second block</Text>
        </div>
      </div>
  );
};


export default LogTab;
