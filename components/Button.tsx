import { Message } from "./Message";
import { PromptBook } from "./PromptBook";

function saveImage(image: string, name: string) {
  // download image from external URL
  fetch(image)
    .then((res) => res.blob())
    .then((blob) => {
      // create blob link to download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.setAttribute("download", `${name}.png`);
      link.setAttribute("href", url);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
}

export function Button({
  btn,
  message,
  selectedImage,
}: {
  btn: Button;
  message: Message;
  selectedImage: number;
}) {
  const addPrompt = PromptBook.use((state) => state.addPrompt);

  return (
    <button
      className="border-white/10 border rounded px-3 py-1 text-white/75 font-semibold hover:bg-backgroundSecondary hover:text-white/100 duration-200"
      onClick={() => {
        if (btn.id == "regenerate") {
          Message.sendPromptMessage(message.prompt, message.modifiers);
        } else if (btn.id == "save") {
          if (selectedImage === -1) {
            message.images.forEach((image, i) =>
              saveImage(
                image.image,
                `${message.prompt.replace(/[^a-zA-Z0-9]/g, "_")}-${i}`
              )
            );
          } else {
            saveImage(
              message.images[selectedImage].image,
              message.prompt.replace(/[^a-zA-Z0-9]/g, "_")
            );
          }
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
