import Head from "next/head";
import { MessageCircle, Send, Settings2 } from "lucide-react";
import React from "react";

interface Artifact {
  image: string;
  seed: number;
}

interface Message {
  type: "you" | "stable diffusion";
  timestamp?: number;
  images?: Artifact[];
  prompt?: string;
  loading?: boolean;
  settings?: Settings;
  buttons?: Button[];
  error?: string;
}

interface Button {
  text: string;
  id: string;
}

interface Settings {
  model:
    | "stable-diffusion-v1-5"
    | "stable-diffusion-512-v2-1"
    | "stable-diffusion-768-v2-1";
  width: number;
  height: number;
  count: number;
}

function sendNotification(options: NotificationOptions) {
  if (document.hasFocus()) return;

  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    new Notification("New message from Chat Diffusion", options);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("New message from Chat Diffusion", options);
      }
    });
  }
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
  } else if (Notification.permission === "denied") {
    Notification.requestPermission();
  }
}

const b64toBlob = (b64Data: string, contentType = "") => {
  // Decode the base64 string into a new Buffer object
  const buffer = Buffer.from(b64Data, "base64");

  // Create a new blob object from the buffer
  return new Blob([buffer], { type: contentType });
};

export default function Home() {
  const [prompt, setPrompt] = React.useState<string>("");
  const [history, setHistory] = React.useState<Message[]>([]);
  const inputContainer = React.useRef<HTMLDivElement>(null);
  const mainConatiner = React.useRef<HTMLDivElement>(null);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<Settings>({
    model: "stable-diffusion-v1-5",
    width: 512,
    height: 512,
    count: 4,
  });

  function addToHistory(message: Message): number {
    setHistory((prev) => [
      ...prev,
      {
        ...message,
        timestamp: Date.now(),
      },
    ]);

    return history.length + 1;
  }

  function editMessage(index: number, message: Message) {
    setHistory((prev) => {
      const newHistory = [...prev];
      newHistory[index] = {
        ...message,
        timestamp: Date.now(),
      };
      return newHistory;
    });
  }

  async function makeImage(overridePrompt?: string) {
    if (!prompt && !overridePrompt) return;

    setPrompt("");
    setSettingsOpen(false);

    addToHistory({
      type: "you",
      prompt: prompt || overridePrompt,
    });

    await new Promise((r) => setTimeout(r, 400));
    const newMsg: Message = {
      type: "stable diffusion",
      prompt: prompt || overridePrompt,
      images: [],
      loading: true,
      settings,
      buttons: [],
    };
    const newMsgIndex = addToHistory(newMsg);

    requestNotificationPermission();

    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt || overridePrompt,
        model: settings.model,
        width: settings.width,
        height: settings.height,
        count: settings.count,
      }),
    });

    if (!res.ok) {
      newMsg.error = "Something went wrong";
      newMsg.loading = false;
      newMsg.buttons = [
        {
          text: "Retry",
          id: "regenerate",
        },
      ];
      editMessage(newMsgIndex, newMsg);
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
        text: "Save",
        id: "save",
      },
    ];
    console.log("new msg", newMsg);
    editMessage(newMsgIndex, newMsg);
    sendNotification({
      icon: newMsg.images![0].image,
      body: prompt || overridePrompt,
      tag: "chat-diffusion",
      requireInteraction: false,
    });
  }

  React.useEffect(() => {
    setTimeout(() => {
      if (mainConatiner.current && inputContainer.current) {
        mainConatiner.current.style.marginBottom = `${inputContainer.current.offsetHeight}px`;
      }

      window.scrollTo({
        behavior: "smooth",
        top: document.body.scrollHeight,
      });
    }, 100);
  }, [history]);

  return (
    <>
      <Head>
        <title>Diffusion Chat</title>
        <meta name="description" content="Talk directly to latent space" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col gap-1 w-full" ref={mainConatiner}>
        <div className="flex flex-col gap-2 mt-24 pb-6 mx-auto max-w-[60rem] p-2 lg:p-0 w-full">
          <div className="p-3 rounded-full bg-white/10 w-fit">
            <MessageCircle className="text-white/75" size={32} />
          </div>
          <h1 className="text-4xl font-bold">Welcome to Chat Diffusion</h1>
          <h2 className="text-white/75 text-xl mt-2">
            Talk directly to latent space.
          </h2>
          <div className="border-b border-white/10" />
        </div>
        {history.map((message, i) => (
          <Message key={i} message={message} makeImage={makeImage} />
        ))}
      </main>
      <div
        className="fixed bottom-0 w-screen bg-[#2c2c2c]"
        ref={inputContainer}
      >
        <div className="w-full mx-auto max-w-[60.75rem] pr-[0.5rem] lg:pl-0 pl-[0.5rem] relative">
          <Settings
            open={settingsOpen}
            settings={settings}
            setSettings={setSettings}
          />
          <div className="px-4 py-3 mt-2 rounded-lg bg-[#424242] flex flex-row items-center w-full mb-6">
            <input
              type="text"
              className="w-full text-lg text-white/75 placeholder:text-white/30 outline-none focus:border-none bg-transparent"
              placeholder="Type what you want to see..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  makeImage();
                  e.preventDefault();
                  // check if on mobile
                  if (window.innerWidth < 768) {
                    // @ts-ignore
                    e.target.blur();
                  }
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
                  setSettingsOpen(!settingsOpen);
                }}
              >
                <Settings2
                  className={`${
                    settingsOpen
                      ? "text-white"
                      : "hover:text-white text-white/50"
                  } duration-200`}
                  size={20}
                />
              </button>
              <div className="h-[1.5rem] w-[1px] bg-white/10 rounded" />
              <button
                className={`${prompt ? "cursor-pointer" : "cursor-default"}`}
                onClick={() => makeImage()}
              >
                <Send
                  className={`text-white rotate-45 ${
                    prompt ? "hover:opacity-50" : "opacity-25"
                  } duration-200`}
                  size={20}
                  fill="white"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Message({
  message,
  makeImage,
}: {
  message: Message;
  makeImage: (overridePrompt?: string) => void;
}) {
  const [selectedImage, setSelectedImage] = React.useState(-1);

  return (
    <>
      <div className={`my-2 w-full hover:bg-black/10`}>
        <div
          className={`mx-auto max-w-[60rem] px-2 lg:px-0 flex flex-col w-full ${
            message.type === "you" ? "items-end" : "items-start"
          }`}
        >
          <div className="flex flex-row gap-2 items-center">
            {message.timestamp && (
              <p className="text-white/30 text-sm">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            )}
            <h1 className="font-semibold text-white">
              {message.type === "you" ? "You" : "Stable Diffusion"}
            </h1>
          </div>
          {message.images && message.settings && message.images.length > 0 && (
            <div className={`flex flex-row gap-2 overflow-hidden flex-wrap`}>
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
            <p className="text-white/75 text-right break-all whitespace-pre-wrap">
              {message.prompt}
            </p>
          )}
          {message.loading && message.images && message.images.length === 0 && (
            <div className="flex flex-row gap-1 my-3">
              <div className="animate-pulse bg-white/25 w-3 h-3 rounded-full" />
              <div className="animate-pulse bg-white/25 delay-75 w-3 h-3 rounded-full" />
              <div className="animate-pulse bg-white/25 delay-150 w-3 h-3 rounded-full" />
            </div>
          )}
          {message.buttons && message.buttons.length > 0 && (
            <div className="flex flex-row gap-2 my-2">
              {message.buttons.map((btn, i) => (
                <button
                  key={i}
                  className="border-white/10 border rounded px-3 py-1 text-white/75 font-semibold hover:bg-white/20 hover:text-white/100 duration-200"
                  onClick={() => {
                    if (btn.id == "regenerate") {
                      makeImage(message.prompt);
                    } else if (btn.id == "save") {
                      message.images?.forEach((image) => {
                        const link = document.createElement("a");
                        link.href = image.image;
                        link.download = `image-${new Date().getTime()}.png`;
                        link.click();
                      });
                    }
                  }}
                >
                  {btn.text}
                </button>
              ))}
            </div>
          )}
          {message.error && <p className="text-red-500">{message.error}</p>}
        </div>
      </div>
    </>
  );
}

function Settings({
  open,
  settings,
  setSettings,
}: {
  open: boolean;
  settings: Settings;
  setSettings(settings: any): void;
}) {
  return (
    <div
      className={`absolute bottom-[3.75rem] duration-200 flex flex-col gap-4 p-3 w-80 bg-[#373737] rounded-lg drop-shadow-md ${
        open
          ? "block right-[0.75rem] lg:right-[0.5rem]"
          : "hidden opacity-0 right-[0.75rem]"
      }`}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-white text-sm font-semibold">Model</h1>
        </div>
        <div className="flex flex-row gap-2">
          {["v1.5", "v2.1", "v2.1 large"].map((model) => (
            <button
              key={model}
              className={`rounded flex justify-center font-semibold px-2 items-center ${
                settings.model ===
                (model === "v1.5"
                  ? "stable-diffusion-v1-5"
                  : model === "v2.1"
                  ? "stable-diffusion-512-v2-1"
                  : "stable-diffusion-768-v2-1")
                  ? "bg-white/10 text-white"
                  : "hover:text-white text-white/75"
              }`}
              onClick={() => {
                setSettings({
                  ...settings,
                  model:
                    model === "v1.5"
                      ? "stable-diffusion-v1-5"
                      : model === "v2.1"
                      ? "stable-diffusion-512-v2-1"
                      : "stable-diffusion-768-v2-1",
                  width: Math.max(
                    model === "v2.1 large" ? 768 : 512,
                    settings.width
                  ),
                  height: Math.max(
                    model === "v2.1 large" ? 768 : 512,
                    settings.height
                  ),
                });
              }}
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-white text-sm font-semibold">Size</h1>
          <p className="text-white/50 text-sm">
            {settings.width}x{settings.height}
          </p>
        </div>
        <input
          type="range"
          className="w-full h-2 bg-white/10 rounded-full appearance-none"
          min={settings.model === "stable-diffusion-768-v2-1" ? 768 : 512}
          max={1024}
          step={64}
          value={settings.width}
          onChange={(e) => {
            setSettings({
              ...settings,
              width: parseInt(e.target.value),
              height: parseInt(e.target.value),
            });
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-white text-sm font-semibold">Image Count</h1>
          <p className="text-white/50 text-sm">{settings.count}</p>
        </div>
        <input
          type="range"
          className="w-full h-2 bg-white/10 rounded-full appearance-none"
          min={1}
          max={10}
          step={1}
          value={settings.count}
          onChange={(e) => {
            setSettings({
              ...settings,
              count: parseInt(e.target.value),
            });
          }}
        />
      </div>
    </div>
  );
}
