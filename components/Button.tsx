import { Message } from "./Message";
import { PromptBook } from "./PromptBook";

export function Button({ btn, message }: { btn: Button; message: Message }) {
  const addPrompt = PromptBook.use((state) => state.addPrompt);

  return (
    <button
      className="border-white/10 border rounded px-3 py-1 text-white/75 font-semibold hover:bg-backgroundSecondary hover:text-white/100 duration-200"
      onClick={() => {
        if (btn.id == "regenerate") {
          Message.sendPromptMessage(message.prompt, message.modifiers);
        } else if (btn.id == "save") {
          message.images?.forEach((image) => {
            const link = document.createElement("a");
            link.href = image.image;
            link.download = `image-${new Date().getTime()}.png`;
            link.click();
          });
        } else if (btn.id == "remix") {
          Message.sendPromptMessage(message.prompt);
        } else if (btn.id == "save_prompt" && message.prompt) {
          addPrompt(message.prompt);
        }
      }}
    >
      {btn.text}
    </button>
  );
}

export type Button = {
  text: string;
  id: string;
};
