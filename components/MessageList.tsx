import { Message } from "./Message";
import create from "zustand";

export const makeId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const sessionID = makeId();

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

  export const getLastNMessages = (n: number) => {
    const messages = use.getState().messages;

    const values = Object.values(messages);
    return values.sort((a, b) => b.timestamp - a.timestamp).slice(0, n);
  };
}
