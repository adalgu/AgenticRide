import React from 'react';
import { Edit } from 'react-feather';
import { Button } from '../button/Button';
import { LOCAL_RELAY_SERVER_URL } from '../../constants/config';

interface HeaderProps {
  apiKey: string;
  onResetApiKey: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiKey, onResetApiKey }) => {
  return (
    <div className="content-top">
      <div className="content-title">
        <img src="/openai-logomark.svg" alt="OpenAI Logo" />
        <span>realtime console</span>
      </div>
      <div className="content-api-key">
        {!LOCAL_RELAY_SERVER_URL && (
          <Button
            icon={Edit}
            iconPosition="end"
            buttonStyle="flush"
            label={`api key: ${apiKey.slice(0, 3)}...`}
            onClick={onResetApiKey}
          />
        )}
      </div>
    </div>
  );
};
