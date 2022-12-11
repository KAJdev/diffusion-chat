import { Wand2 } from "lucide-react";
import React from "react";
import { Button } from "./Button";
import { ChatBar } from "./ChatBar";
import { Image } from "./Image";
import { MessageList } from "./MessageList";
import { PromptBook } from "./PromptBook";
import { PromptEngine } from "./PromptEngine";
import { Settings } from "./Settings";

export function Message({ id }: { id: string }) {
  const [message, editMessage] = MessageList.useMessage(id);
  const [selectedImage, setSelectedImage] = React.useState(-1);

  const savedPrompts = PromptBook.use((state) => state.prompts);

  return (
    <div className={`my-2 w-full hover:bg-black/10`}>
      <div
        className={`mx-auto max-w-[60rem] px-2 lg:px-0 flex flex-col w-full ${
          message.type === "you" ? "items-start" : "items-end"
        }`}
      >
        <div className="flex flex-row gap-2 items-end h-fit">
          <h1 className="font-semibold text-white">
            {message.type === "you" ? "You" : "Stable Diffusion"}
          </h1>
          {message.timestamp && (
            <p className="text-white/30 text-xs pb-0.5">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          )}
          {message.modifiers && (
            <Wand2 className="text-white/30 pb-[3px]" size={16} />
          )}
        </div>
        {message.prompt && message.type === "you" && (
          <p className="text-white/75 text-left break-word">{message.prompt}</p>
        )}
        {message.images && message.settings && message.images.length > 0 && (
          <div
            className={`flex flex-row gap-2 overflow-hidden flex-wrap max-w-full`}
          >
            {message.images.map((image, i) => (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <Image
                key={i}
                i={i}
                image={image}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                message={message}
              />
            ))}
          </div>
        )}
        {message.error && <p className="text-red-500">{message.error}</p>}
        {message.loading && message.images && message.images.length === 0 && (
          <div className="flex flex-row gap-1 my-3">
            <div className="animate-pulse bg-white/25 w-3 h-3 rounded-full" />
            <div className="animate-pulse bg-white/25 delay-75 w-3 h-3 rounded-full" />
            <div className="animate-pulse bg-white/25 delay-150 w-3 h-3 rounded-full" />
          </div>
        )}
        {message.buttons && message.buttons.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2 my-2">
            {message.buttons.map((btn, i) => {
              if (
                btn.id === "save_prompt" &&
                (!message.prompt || savedPrompts.includes(message.prompt))
              )
                return null;

              return (
                <Button
                  key={i}
                  btn={btn}
                  message={message}
                  selectedImage={selectedImage}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export enum MessageType {
  YOU = "you",
  STABLE_DIFFUSION = "stable diffusion",
  OTHER = "other",
  SYSTEM = "system",
}

export type Message = {
  type: MessageType;
  id: string;
  timestamp: number;
  prompt: string;
  modifiers: string | undefined;
  loading: boolean;
  buttons: Button[];
  error: string | null;
  images: Artifact[];
  settings: Settings | null;
};

export type Artifact = {
  image: string;
  seed: number;
};

export namespace Message {
  export const makeId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  export const b64toBlob = (b64Data: string, contentType = "") => {
    // Decode the base64 string into a new Buffer object
    const buffer = Buffer.from(b64Data, "base64");

    // Create a new blob object from the buffer
    return new Blob([buffer], { type: contentType });
  };

  export const sendPromptMessage = async (
    prompt: string,
    modifiers?: string
  ) => {
    if (!prompt && !modifiers) return;

    const settings = Settings.use.getState().settings;
    Settings.use.getState().setOpen(false);

    if (prompt.length < 150 && !modifiers) {
      modifiers = PromptEngine.getModifers();
    }

    if (prompt.length < 35) {
      if (modifiers) {
        modifiers = prompt + " " + modifiers;
      } else {
        modifiers = prompt;
      }
    }

    ChatBar.use.getState().setPrompt("");

    const uid = makeId();
    const newMsg: Message = {
      type: MessageType.YOU,
      id: uid,
      prompt: prompt,
      modifiers: modifiers || undefined,
      timestamp: Date.now(),
      loading: true,
      buttons: [],
      error: null,
      images: [],
      settings: settings,
    };
    MessageList.use.getState().addMessage(newMsg);

    const res = await fetch("https://api.diffusion.chat/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        modifiers,
        model: settings.model,
        width: settings.width,
        height: settings.height,
        count: settings.count,
        steps: settings.steps,
        scale: settings.scale,
      }),
    });

    if (!res.ok) {
      switch (res.status) {
        case 400:
          newMsg.error = "Bad request";
          break;
        case 429:
          newMsg.error = "You're too fast! Slow down!";
          break;
        default:
          newMsg.error = "Something went wrong";
          break;
      }
      newMsg.loading = false;
      newMsg.buttons = [
        {
          text: "Retry",
          id: "regenerate",
        },
      ];
      MessageList.use.getState().editMessage(uid, newMsg);
      return;
    }

    const data = await res.json();
    newMsg.images = data;

    newMsg.loading = false;
    newMsg.buttons = [
      {
        text: "Regenerate",
        id: "regenerate",
      },
      {
        text: "Download",
        id: "save",
      },
      {
        text: "Save Prompt",
        id: "save_prompt",
      },
    ];

    if (newMsg.modifiers) {
      newMsg.buttons.push({
        text: "Remix",
        id: "remix",
      });
    }

    console.log("new msg", newMsg);
    MessageList.use.getState().editMessage(uid, newMsg);
  };
}
