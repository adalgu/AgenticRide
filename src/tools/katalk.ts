import axios from 'axios';
import { ToolDefinition } from '../types/tools';

// Type guard for Axios errors
function isAxiosError(error: any): error is Error & { 
  isAxiosError: true; 
  response?: { 
    data?: any; 
    status?: number; 
  }; 
  code?: string; 
} {
  return error && error.isAxiosError === true;
}

export const sendKakaoTalkTool: ToolDefinition = {
  name: 'send_kakaotalk',
  description: 'Send a personal KakaoTalk message to a specific receiver',
  parameters: {
    type: 'object',
    properties: {
      receiver: {
        type: 'string',
        description: 'Receiver\'s KakaoTalk ID (e.g., "gunn.kim")'
      },
      message: {
        type: 'string',
        description: 'Message to send'
      }
    },
    required: ['receiver', 'message']
  },
  handler: async (params) => {
    const { receiver, message } = params;
    
    try {
      console.log(`Attempting to send KakaoTalk message to ${receiver}: ${message}`);

      // Simulate API call with more detailed error handling
      const response = await axios.get('http://api.noti.daumkakao.io/send/personal/kakaotalk', {
        params: {
          to: receiver,
          msg: message
        },
        // Add timeout and more detailed error handling
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Default
        }
      });

      console.log('KakaoTalk API Response:', response.data);

      // Check for specific response conditions
      if (response.status !== 200) {
        return {
          status: 'error',
          message: `Failed to send message to ${receiver}`,
          details: `HTTP Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
        };
      }

      return {
        status: 'success',
        message: `Message sent to ${receiver}`,
        details: response.data
      };
    } catch (error: any) {
      console.error('KakaoTalk Message Send Error:', error);

      // More detailed error logging
      if (isAxiosError(error)) {
        return {
          status: 'error',
          message: `Failed to send message to ${receiver}`,
          details: {
            errorType: 'AxiosError',
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status
          }
        };
      }
      
      return {
        status: 'error',
        message: `Failed to send message to ${receiver}`,
        details: {
          errorType: 'UnknownError',
          message: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
};
