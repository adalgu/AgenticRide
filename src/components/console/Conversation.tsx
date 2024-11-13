import { useConsole } from '../../contexts/ConsoleContext';
import { useConsoleHandlers } from '../../hooks/useConsoleHandlers';
import { ConversationItem } from '../conversation/ConversationItem';

export function Conversation() {
  const { items } = useConsole();
  const { deleteConversationItem } = useConsoleHandlers();

  return (
    <div className="content-block conversation">
      <div className="content-block-title">conversation</div>
      <div className="content-block-body" data-conversation-content>
        {!items.length && `awaiting connection...`}
        {items.map((item) => (
          <ConversationItem
            key={item.id}
            item={item}
            onDelete={deleteConversationItem}
          />
        ))}
      </div>
    </div>
  );
}
