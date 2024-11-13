import { useConsole } from '../../contexts/ConsoleContext';
import { useConsoleHandlers } from '../../hooks/useConsoleHandlers';
import { Button } from '../button/Button';
import { Toggle } from '../toggle/Toggle';
import { X, Zap } from 'react-feather';

export function ConsoleActions() {
  const { isConnected, canPushToTalk, isRecording } = useConsole();
  const {
    handleTurnEndTypeChange,
    connectConversation,
    disconnectConversation,
    startRecording,
    stopRecording,
  } = useConsoleHandlers();

  return (
    <div className="content-actions">
      <Toggle
        defaultValue={false}
        labels={['manual', 'vad']}
        values={['none', 'server_vad']}
        onChange={handleTurnEndTypeChange}
      />
      <div className="spacer" />
      {isConnected && canPushToTalk && (
        <Button
          label={isRecording ? 'release to send' : 'push to talk'}
          buttonStyle={isRecording ? 'alert' : 'regular'}
          disabled={!isConnected || !canPushToTalk}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
        />
      )}
      <div className="spacer" />
      <Button
        label={isConnected ? 'disconnect' : 'connect'}
        iconPosition={isConnected ? 'end' : 'start'}
        icon={isConnected ? X : Zap}
        buttonStyle={isConnected ? 'regular' : 'action'}
        onClick={isConnected ? disconnectConversation : connectConversation}
      />
    </div>
  );
}
