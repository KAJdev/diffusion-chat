import { Plus, Trash2, X } from "lucide-react";
import React from "react";
import create from "zustand";
import { ChatBar } from "./ChatBar";

export function PromptBook() {
  const [prompts, addPrompt, deletePrompt, setPrompts, open, setOpen] =
    PromptBook.use((state) => [
      state.prompts,
      state.addPrompt,
      state.deletePrompt,
      state.setPrompts,
      state.isOpen,
      state.setOpen,
    ]);

  const [prompt, setPrompt] = ChatBar.use((state) => [
    state.prompt,
    state.setPrompt,
  ]);

  React.useEffect(() => {
    // load from local storage
    const loadedPrompts = localStorage.getItem("prompts");
    if (loadedPrompts?.startsWith("[") && loadedPrompts?.endsWith("]")) {
      setPrompts(JSON.parse(loadedPrompts));
    }

    // write serializer
    const unsub = PromptBook.use.subscribe((newPrompts) => {
      localStorage.setItem("prompts", JSON.stringify(newPrompts.prompts));
    });

    return () => unsub();
  }, [setPrompts]);

  return (
    <div
      className={`absolute bottom-[3.75rem] min-h-[13rem] max-h-[30rem] overflow-y-auto duration-200 flex flex-col gap-1 p-2 w-80 bg-settingsPanel border border-chatbox rounded-lg drop-shadow-md ${
        open
          ? "block right-[0.75rem] lg:right-[0.5rem]"
          : "hidden opacity-0 right-[0.75rem]"
      }`}
    >
      {prompts.length > 0 ? (
        <>
          {prompt && !prompts.includes(prompt) && (
            <button
              className="flex flex-row justify-between items-center w-full border border-white/10 hover:border-white/20 border-dashed hover:text-white duration-150 rounded"
              onClick={() => {
                addPrompt(prompt);
              }}
            >
              <p className="text-white/75 text-center p-2 w-full text-sm font-semibold flex flex-row items-center justify-center gap-2">
                Save Current prompt <Plus className="w-4 h-4" />
              </p>
            </button>
          )}
          {prompts.map((prompt, i) => (
            <button
              key={prompt}
              className="flex flex-row justify-between group relative text-white/75 hover:text-white items-center border-b last-of-type:border-none pb-2 last-of-type:pb-0 border-white/10 w-full"
              onClick={() => {
                setPrompt(prompt);
                setOpen(false);
              }}
            >
              <p className="text-sm text-left break-word max-h-[5rem] overflow-hidden text-ellipsis">
                {prompt}
              </p>
              <div
                className="flex justify-center absolute top-0 right-0 items-center w-6 h-6 hover:bg-[#32363d] text-red-500 hover:text-bold bg-[#292d33] opacity-0 group-hover:opacity-100 rounded-full duration-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePrompt(prompt);
                }}
              >
                <X className="w-4 h-4" />
              </div>
            </button>
          ))}
        </>
      ) : (
        <div className="w-full h-full flex justify-center grow items-center">
          {prompt ? (
            <button
              className="text-white text-sm font-semibold border border-white/10 hover:border-white/25 duration-200 p-2 px-3 rounded-lg"
              onClick={() => addPrompt(prompt)}
            >
              Save current prompt
            </button>
          ) : (
            <p className="text-white text-sm font-semibold">No prompts saved</p>
          )}
        </div>
      )}
    </div>
  );
}

export type PromptBook = {
  prompts: string[];
  addPrompt: (prompt: string) => void;
  deletePrompt: (prompt: string) => void;
  setPrompts: (prompts: string[]) => void;

  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};

export namespace PromptBook {
  export const use = create<PromptBook>()((set) => ({
    prompts: [],
    addPrompt: (prompt: string) =>
      set((state: PromptBook) => ({
        prompts: [...state.prompts, prompt],
      })),
    deletePrompt: (prompt: string) =>
      set((state: PromptBook) => ({
        prompts: state.prompts.filter((p) => p !== prompt),
      })),
    setPrompts: (prompts: string[]) =>
      set((state: PromptBook) => ({ prompts })),

    isOpen: false,
    setOpen: (isOpen: boolean) => set((state: PromptBook) => ({ isOpen })),
  }));
}
