import { Wand2 } from "lucide-react";
import React from "react";
import { Button } from "./Button";
import { ChatBar } from "./ChatBar";
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
          message.type === "you" ? "items-end" : "items-start"
        }`}
      >
        <div className="flex flex-row gap-2 items-center">
          {message.timestamp && (
            <p className="text-white/30 self-end">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          )}
          <h1 className="font-semibold text-white">
            {message.type === "you" ? "You" : "Stable Diffusion"}
          </h1>
          {message.modifiers && message.type !== "you" && (
            <Wand2 className="text-white/30" size={16} />
          )}
        </div>
        {message.images && message.settings && message.images.length > 0 && (
          <div
            className={`flex flex-row gap-2 overflow-hidden flex-wrap max-w-full`}
          >
            {message.images.map((image, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={image.image}
                alt="Generated image"
                className={`rounded mt-2 duration-300 hover:opacity-75 cursor-pointer`}
                style={{
                  maxHeight:
                    selectedImage === i || message.images?.length === 1
                      ? "25rem"
                      : "10rem",
                  maxWidth:
                    selectedImage === i || message.images?.length === 1
                      ? "25rem"
                      : "10rem",
                  height:
                    selectedImage > -1 &&
                    selectedImage !== i &&
                    message.images?.length !== 1
                      ? "0"
                      : `${message.settings?.height}px`,
                  width:
                    selectedImage > -1 &&
                    selectedImage !== i &&
                    message.images?.length !== 1
                      ? "0"
                      : `${message.settings?.width}px`,
                }}
                onClick={() => {
                  if (message.images?.length === 1) return;

                  if (selectedImage === i) {
                    setSelectedImage(-1);
                  } else {
                    setSelectedImage(i);
                  }
                }}
                onLoad={() => {
                  window.scrollTo({
                    behavior: "smooth",
                    top: document.body.scrollHeight,
                  });
                }}
              />
            ))}
          </div>
        )}
        {message.prompt && message.type === "you" && (
          <p className="text-white/75 text-right break-word">
            {message.prompt}
          </p>
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
          <div className="flex flex-row gap-2 my-2">
            {message.buttons.map((btn, i) => {
              if (
                btn.id === "save_prompt" &&
                (!message.prompt || savedPrompts.includes(message.prompt))
              )
                return null;

              return <Button key={i} btn={btn} message={message} />;
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

    MessageList.use.getState().addMessage({
      type: MessageType.YOU,
      id: Message.makeId(),
      prompt: prompt,
      modifiers: modifiers || undefined,
      timestamp: Date.now(),
      loading: false,
      buttons: [],
      error: null,
      images: [],
      settings: null,
    });

    await new Promise((r) => setTimeout(r, 400));
    const uid = makeId();
    const newMsg: Message = {
      type: MessageType.STABLE_DIFFUSION,
      prompt: prompt,
      modifiers: modifiers || undefined,
      images: [],
      loading: true,
      buttons: [],
      id: uid,
      timestamp: Date.now(),
      error: null,
      settings: settings,
    };
    MessageList.use.getState().addMessage(newMsg);

    const res = await fetch("/api/image", {
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

    for (const artifact of data.artifacts) {
      // turn the base64 url into a blob
      const blob = b64toBlob(artifact.base64, "image/png");

      // turn the blob into a url
      const url = URL.createObjectURL(blob);

      newMsg.images!.push({
        image: url,
        seed: artifact.seed,
      });
    }

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
