import { Frown, Smile, Wand2 } from "lucide-react";
import React from "react";
import { Button } from "./Button";
import { ChatBar } from "./ChatBar";
import { Image } from "./Image";
import { MessageList, sessionID, makeId } from "./MessageList";
import { PromptBook } from "./PromptBook";
import { PromptEngine } from "./PromptEngine";
import { Settings } from "./Settings";

export function Message({ id }: { id: string }) {
  const [message, editMessage] = MessageList.useMessage(id);
  const [selectedImage, setSelectedImage] = React.useState(-1);

  const savedPrompts = PromptBook.use((state) => state.prompts);

  return (
    <div className={`my-2 w-full hover:bg-black/10 group`}>
      <div
        className={`mx-auto max-w-[60rem] relative px-2 lg:px-0 flex flex-col w-full ${
          message.type === "you" ? "items-start" : "items-end"
        }`}
      >
        {message.images && message.images.length > 0 && (
          <div className="absolute hidden group-hover:flex top-0 -translate-y-[50%] duration-200 right-0 hover:drop-shadow-lg flex-row rounded overflow-hidden bg-chatbox">
            <div
              onClick={() => Message.rateMessage(message, 1)}
              className={`p-1.5 border-r border-[#31363f] last-of-type:border-transparent duration-200 cursor-pointer ${
                message.rating < 3
                  ? "bg-white/[7%] text-red-300"
                  : "text-red-300/30 hover:text-red-300 hover:bg-white/5"
              }`}
            >
              <Frown size={24} />
            </div>
            <div
              onClick={() => Message.rateMessage(message, 5)}
              className={`p-1.5 border-r border-[#31363f] last-of-type:border-transparent duration-200 cursor-pointer ${
                message.rating > 3
                  ? "bg-white/[7%] text-green-300"
                  : "text-green-300/30 hover:text-green-300 hover:bg-white/5"
              }`}
            >
              <Smile size={24} />
            </div>
          </div>
        )}
        {message.rating !== 3 && (
          <div className="absolute top-0 right-0 block group-hover:hidden">
            {message.rating < 3 && (
              <Frown className="text-red-300/30" size={24} />
            )}
            {message.rating > 3 && (
              <Smile className="text-green-300/30" size={24} />
            )}
          </div>
        )}
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
  rating: number;
};

export type Artifact = {
  image: string;
  seed: number;
  id: string;
};

const SURE_ANIME_WORDS = [
  "1girl",
  "2girls",
  "highres",
  "looking at viewer",
  "looking_at_viewer",
];

const POSSIBLE_ANIME_WORDS = [
  "breasts",
  "skirt",
  "blush",
  "smile",
  "solo",
  "simple background",
  "simple_background",
  "multiple girls",
  "multiple_girls",
];

export namespace Message {
  export const b64toBlob = (b64Data: string, contentType = "") => {
    // Decode the base64 string into a new Buffer object
    const buffer = Buffer.from(b64Data, "base64");

    // Create a new blob object from the buffer
    return new Blob([buffer], { type: contentType });
  };

  export const rateMessage = async (message: Message, rating: number) => {
    MessageList.use.setState((state) => {
      const newMessages = { ...state.messages };
      newMessages[message.id].rating = rating;
      return { ...state, messages: newMessages };
    });

    let res = null;
    try {
      res = await fetch("https://api.diffusion.chat/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: message.images.map((img) => img.id),
          rating,
        }),
      });
    } catch (e) {
      console.log(e);
    }

    if (!res || !res.ok) {
      MessageList.use.setState((state) => {
        const newMessages = { ...state.messages };
        newMessages[message.id].rating = 3;
        return { ...state, messages: newMessages };
      });
    } else {
      console.log("rated", res);
    }
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
      rating: 3,
    };
    MessageList.use.getState().addMessage(newMsg);

    let res = null;

    try {
      if (
        settings.model == "anything-v3.0" ||
        SURE_ANIME_WORDS.some((word) => prompt.includes(word)) ||
        POSSIBLE_ANIME_WORDS.filter((word) => prompt.includes(word)).length >= 3
      ) {
        res = await fetch("https://api.diffusion.chat/anime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt,
            width: 512,
            height: 512,
            count: 4,
            steps: settings.steps,
            scale: settings.scale,
            session: sessionID,
          }),
        });
      } else {
        res = await fetch("https://api.diffusion.chat/image", {
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
            session: sessionID,
          }),
        });
      }
    } catch (e) {
      console.log(e);
    }

    if (!res || !res.ok) {
      switch (res?.status) {
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
