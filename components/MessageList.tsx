import { Message } from "./Message";
import create from "zustand";

export function MessageList() {
  const history = MessageList.use((state) => state.messages);

  return (
    <>
      {Object.values(history).map((message) => (
        <>{message && <Message key={message.id} id={message.id} />}</>
      ))}
    </>
  );
}

export type MessageHistory = {
  messages: Record<string, Message>;
  addMessage: (message: Message) => void;
  editMessage: (id: string, message: Message) => void;
  deleteMessage: (id: string) => void;
};

export namespace MessageList {
  export const use = create<MessageHistory>()((set) => ({
    messages: {},
    addMessage: (message: Message) =>
      set((state: MessageHistory) => ({
        messages: { ...state.messages, [message.id]: message },
      })),
    editMessage: (id: string, message: Message) =>
      set((state: MessageHistory) => ({
        messages: { ...state.messages, [id]: message },
      })),
    deleteMessage: (id: string) => {
      const messages = { ...MessageList.use.getState().messages };
      delete messages[id];
      set((state: MessageHistory) => ({
        messages,
      }));
    },
  }));

  export const useMessage = (id: string) => {
    const message = MessageList.use((state) => state.messages[id]);
    const setMessage = (message: Message) =>
      MessageList.use.getState().editMessage(id, message);
    return [message, setMessage] as const;
  };
}
