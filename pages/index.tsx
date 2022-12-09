import Head from "next/head";
import { MessageCircle, Send, Settings2 } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

interface Artifact {
  image: string;
  seed: number;
}

interface Message {
  type: "you" | "stable diffusion";
  uuid: string;
  timestamp?: number;
  images?: Artifact[];
  prompt?: string;
  modifiers?: string;
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
  steps: number;
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

const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    steps: 30,
  });

  function addToHistory(message: Message) {
    setHistory((prev) => {
      const newHistory = [...prev];
      newHistory.push({
        ...message,
        timestamp: Date.now(),
      });
      return newHistory;
    });
  }

  function editMessage(id: string, message: Message) {
    setHistory((prev) => {
      const newHistory = [...prev];
      const index = newHistory.findIndex((m) => m.uuid === id);
      newHistory[index] = {
        ...message,
        timestamp: Date.now(),
      };
      return newHistory;
    });
  }

  async function makeImage(
    overridePrompt?: string,
    overrideModifiers?: string
  ) {
    if (!prompt && !overridePrompt) return;

    const originalPrompt = prompt || overridePrompt || "";
    let modifiers = overrideModifiers || null;

    if (originalPrompt.length < 75 && !modifiers) {
      modifiers = spicePrompt();
    }

    setPrompt("");
    setSettingsOpen(false);

    addToHistory({
      type: "you",
      prompt: originalPrompt,
      modifiers: modifiers || undefined,
      uuid: uuidv4(),
    });

    await new Promise((r) => setTimeout(r, 400));
    const uid = uuidv4();
    const newMsg: Message = {
      type: "stable diffusion",
      prompt: originalPrompt,
      modifiers: modifiers || undefined,
      images: [],
      loading: true,
      settings,
      buttons: [],
      uuid: uid,
    };
    addToHistory(newMsg);

    requestNotificationPermission();

    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: originalPrompt,
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
      editMessage(uid, newMsg);
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
    editMessage(uid, newMsg);
    sendNotification({
      icon: newMsg.images![0].image,
      body: newMsg.prompt,
      tag: "chat-diffusion",
      requireInteraction: false,
    });
  }

  React.useEffect(() => {
    setTimeout(() => {
      if (mainConatiner.current && inputContainer.current) {
        mainConatiner.current.style.marginBottom = `${
          inputContainer.current.offsetHeight + 24
        }px`;
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
          <h1 className="text-4xl font-bold">Welcome to #diffusion-chat</h1>
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
        className="fixed bottom-0 w-screen bg-background"
        ref={inputContainer}
      >
        <div
          className={`${
            !prompt && history.length < 1 ? "" : ""
          } relative w-full mx-auto max-w-[60.75rem]`}
        >
          <div
            className={`absolute duration-200 ${
              !prompt && history.length < 10
                ? "-bottom-[1.5rem]"
                : "-bottom-[3.75rem]"
            } pr-[0.5rem] w-full lg:pl-0 pl-[0.5rem]`}
          >
            <div className="bg-popupBar rounded-lg w-full pb-5 px-4 pt-1.5 text-white/75 text-sm">
              {"Don't know what to say? "}{" "}
              <span
                className="text-blue-400 hover:underline cursor-pointer"
                onClick={() => setPrompt(suprisePrompt())}
              >
                Surprise Me!
              </span>
            </div>
          </div>
        </div>
        <div className="w-full mx-auto max-w-[60.75rem] pr-[0.5rem] lg:pl-0 pl-[0.5rem] relative">
          <Settings
            open={settingsOpen}
            settings={settings}
            setSettings={setSettings}
          />
          <div
            className={`px-4 py-3 mt-2 z-10 bg-chatbox flex flex-row items-center w-full mb-6 ${
              !prompt && history.length < 10
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
      </div>
    </>
  );
}

function Message({
  message,
  makeImage,
}: {
  message: Message;
  makeImage: (overridePrompt?: string, overrideModifiers?: string) => void;
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
            <p className="text-white/75 text-right break-all whitespace-pre-wrap">
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
              {message.buttons.map((btn, i) => (
                <button
                  key={i}
                  className="border-white/10 border rounded px-3 py-1 text-white/75 font-semibold hover:bg-backgroundSecondary hover:text-white/100 duration-200"
                  onClick={() => {
                    if (btn.id == "regenerate") {
                      makeImage(message.prompt, message.modifiers);
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
      className={`absolute bottom-[3.75rem] duration-200 flex flex-col gap-4 p-3 w-80 bg-settingsPanel border border-chatbox rounded-lg drop-shadow-md ${
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

      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          <h1 className="text-white text-sm font-semibold">Steps</h1>
          <p className="text-white/50 text-sm">{settings.steps}</p>
        </div>
        <input
          type="range"
          className="w-full h-2 bg-white/10 rounded-full appearance-none"
          min={10}
          max={150}
          step={1}
          value={settings.steps}
          onChange={(e) => {
            setSettings({
              ...settings,
              steps: parseInt(e.target.value),
            });
          }}
        />
      </div>
    </div>
  );
}

const templates = [
  "a {noun} {gerund} by {artist}",
  "{adjective} {noun} {gerund} by {artist}",
  "{adjective} {noun} {gerund} {adverb} by {artist}",
  "a {adjective} {noun} {gerund} {adverb} by {artist}",
];

const nouns = [
  "dog",
  "cat",
  "bird",
  "fish",
  "person",
  "wizard",
  "witch",
  "dragon",
  "unicorn",
  "robot",
  "alien",
  "monster",
  "goblin",
  "elf",
  "dwarf",
  "orc",
  "troll",
  "giant",
  "golem",
  "demon",
  "angel",
  "ghost",
  "vampire",
  "werewolf",
  "zombie",
  "skeleton",
];

const gerunds = [
  "running",
  "walking",
  "flying",
  "swimming",
  "singing",
  "dancing",
  "playing",
  "fighting",
  "hiding",
  "eating",
  "sleeping",
  "drinking",
  "smoking",
  "crying",
  "laughing",
  "screaming",
  "yelling",
  "reading",
  "writing",
  "drawing",
  "painting",
  "jumping",
  "hopping",
  "skipping",
];

const adjectives = [
  "happy",
  "sad",
  "angry",
  "scared",
  "confused",
  "confident",
  "crazy",
  "silly",
  "funny",
  "weird",
  "strange",
  "odd",
  "boring",
  "exciting",
  "amazing",
  "beautiful",
  "ugly",
  "cute",
  "adorable",
  "handsome",
  "pretty",
  "smart",
  "dumb",
  "stupid",
  "clever",
  "brave",
  "shy",
  "quiet",
  "loud",
  "fast",
  "slow",
  "strong",
  "weak",
  "tall",
  "short",
  "fat",
  "skinny",
];

const adverbs = [
  "quickly",
  "slowly",
  "happily",
  "sadly",
  "angrily",
  "scaredly",
  "confusedly",
  "confidently",
  "crazily",
  "sillyly",
  "funnily",
  "weirdly",
  "strangely",
  "oddly",
  "boringly",
  "excitingly",
  "amazingly",
  "beautifully",
  "cutely",
  "adorably",
  "handsomely",
  "prettyly",
  "smartly",
];

const artists = [
  "A-1 Pictures",
  "Alvar Aalto",
  "Annie Leibovitz",
  "Antoni Gaudí",
  "Antonio Gaudí",
  "Antonio López García",
  "Ansel Adams",
  "Ansel Easton Adams",
  "Tyler Edlin",
  "Temmie Chang",
  "Terry Gilliam",
  "Terry Pratchett",
  "Terry Pratchett and Neil Gaiman",
  "Terry Pratchett and Stephen Baxter",
  "Ian Mcewan",
];

const modifiers = [
  "oil painting",
  "watercolor painting",
  "acrylic painting",
  "Professional",
  "trending on CGSociety",
  "trending on DeviantArt",
  "trending on ArtStation",
  "majestic",
  "epic",
  "legendary",
  "magnificent",
  "rustic",
  "vintage",
  "modern",
  "Unreal Engine 4",
  "Unity",
  "Blender",
  "Maya",
  "ZBrush",
  "Substance Painter",
  "Substance Designer",
  "Photoshop",
  "Illustrator",
  "Octane Render",
  "Redshift Render",
  "dramatic lighting",
  "realistic lighting",
  "realistic",
  "photorealistic",
  "refractive",
  "rule of thirds",
  "golden ratio",
  "golden spiral",
  "volumentric lighting",
  "8K",
  "4K",
  "wallpaper",
  "intricately detailed",
  "dramatic",
  "WLOP",
  "artgerm",
  "highly detailed",
  "sharp focus",
  "smooth",
  "mucha",
];

function suprisePrompt(): string {
  const template = templates[Math.floor(Math.random() * templates.length)];
  let s = template
    .replace(/{noun}/g, nouns[Math.floor(Math.random() * nouns.length)])
    .replace(/{gerund}/g, gerunds[Math.floor(Math.random() * gerunds.length)])
    .replace(
      /{adjective}/g,
      adjectives[Math.floor(Math.random() * adjectives.length)]
    )
    .replace(/{adverb}/g, adverbs[Math.floor(Math.random() * adverbs.length)])
    .replace(/{artist}/g, artists[Math.floor(Math.random() * artists.length)]);

  for (let i = 0; i < Math.random() * 10; i++) {
    s += modifiers[Math.floor(Math.random() * modifiers.length)];
  }

  return s;
}

function spicePrompt(): string {
  const modifierArray = [];
  for (let i = 0; i < 5; i++) {
    modifierArray.push(modifiers[Math.floor(Math.random() * modifiers.length)]);
  }
  return modifierArray.join(", ");
}
