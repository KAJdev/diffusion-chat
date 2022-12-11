import { Album, Send, Settings2 } from "lucide-react";
import create from "zustand";
import { Message } from "./Message";
import { MessageList } from "./MessageList";
import { PromptBook } from "./PromptBook";
import { PromptEngine } from "./PromptEngine";
import { Settings } from "./Settings";

export function ChatBar() {
  const [prompt, setPrompt] = ChatBar.use((state) => [
    state.prompt,
    state.setPrompt,
  ]);

  const [promptBookOpen, setPromptBookOpen] = PromptBook.use((state) => [
    state.isOpen,
    state.setOpen,
  ]);

  const [settingsOpen, setSettingsOpen] = Settings.use((state) => [
    state.isOpen,
    state.setOpen,
  ]);

  const history = MessageList.use((state) => state.messages);

  return (
    <>
      <div
        className={`${
          !prompt && Object.keys(history).length < 1 ? "" : ""
        } relative w-full mx-auto max-w-[60.75rem]`}
      >
        <div
          className={`absolute duration-200 ${
            !prompt && Object.keys(history).length < 10
              ? "-bottom-[1.5rem]"
              : "-bottom-[3.75rem]"
          } pr-[0.5rem] w-full lg:pl-0 pl-[0.5rem]`}
        >
          <div className="bg-popupBar rounded-lg w-full pb-5 px-4 pt-1.5 text-white/75 text-sm">
            {"Don't know what to say? "}{" "}
            <span
              className="text-blue-400 hover:underline cursor-pointer"
              onClick={() => setPrompt(PromptEngine.makePrompt())}
            >
              Surprise Me!
            </span>
          </div>
        </div>
      </div>
      <div className="w-full mx-auto max-w-[60.75rem] pr-[0.5rem] lg:pl-0 pl-[0.5rem] relative">
        <Settings />
        <PromptBook />
        <div
          className={`px-4 py-3 mt-2 z-10 bg-chatbox flex flex-row items-center w-full mb-6 ${
            !prompt && Object.keys(history).length < 10
              ? "border-t border-background rounded-b-lg"
              : "rounded-lg"
          }`}
        >
          <input
            type="text"
            className="w-full text-lg text-white/75 placeholder:text-white/30 outline-none focus:border-none bg-transparent"
            placeholder="Type what you want to see..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                Message.sendPromptMessage(prompt);
                e.preventDefault();
                // check if on mobile
                if (window.innerWidth < 768) {
                  // @ts-ignore
                  e.target.blur();
                }
              } else if (e.key === "up" && prompt === "") {
                setPrompt(history[Object.keys(history).length - 1].prompt);
              }
            }}
            style={{
              background: "transparent",
              padding: "0",
              border: "none",
              outline: "none",
            }}
            autoFocus
          />
          <div className="shrink-0 flex flex-row gap-2 items-center h-full ml-4">
            <button
              className="cursor-pointer"
              onClick={() => {
                setPromptBookOpen(!promptBookOpen);
                setSettingsOpen(false);
              }}
            >
              <Album
                className={`${
                  promptBookOpen
                    ? "text-white"
                    : "hover:text-white text-white/50"
                } duration-200`}
                size={20}
              />
            </button>
            <button
              className="cursor-pointer"
              onClick={() => {
                setSettingsOpen(!settingsOpen);
                setPromptBookOpen(false);
              }}
            >
              <Settings2
                className={`${
                  settingsOpen ? "text-white" : "hover:text-white text-white/50"
                } duration-200`}
                size={20}
              />
            </button>
            <div className="h-[1.5rem] w-[1px] bg-white/10 rounded" />
            <button
              className={`${prompt ? "cursor-pointer" : "cursor-default"}`}
              onClick={() => Message.sendPromptMessage(prompt)}
            >
              <Send
                className={`text-accent rotate-45 ${
                  prompt ? "hover:opacity-50" : "opacity-25"
                } duration-200`}
                size={20}
                fill="currentColor"
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export type ChatBar = {
  prompt: string;
  setPrompt: (prompt: string) => void;
};

export namespace ChatBar {
  export const use = create<ChatBar>()((set) => ({
    prompt: "",
    setPrompt: (prompt: string) => set((state: ChatBar) => ({ prompt })),
  }));
}
