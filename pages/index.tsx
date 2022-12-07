import Head from "next/head";
import { MessageCircle, Send } from "lucide-react";
import React from "react";

interface Message {
  type: "you" | "stable diffusion";
  timestamp?: number;
  images?: string[];
  prompt?: string;
  loading?: boolean;
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

  async function makeImage() {
    if (!prompt) return;

    setPrompt("");

    addToHistory({
      type: "you",
      prompt,
    });

    await new Promise((r) => setTimeout(r, 400));
    const newMsg: Message = {
      type: "stable diffusion",
      prompt,
      images: [],
      loading: true,
    };
    const newMsgIndex = addToHistory(newMsg);

    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    for (const artifact of data.artifacts) {
      // turn the base64 url into a blob
      const blob = b64toBlob(artifact.base64, "image/png");

      // turn the blob into a url
      const url = URL.createObjectURL(blob);

      newMsg.images!.push(url);
    }

    newMsg.loading = false;
    editMessage(newMsgIndex, newMsg);
  }

  return (
    <>
      <Head>
        <title>Chat Diffusion</title>
        <meta name="description" content="Talk directly to latent space" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mx-auto max-w-[60rem] flex flex-col h-screen w-screen p-6">
        <div className="overflow-y-auto flex flex-col-reverse h-full w-full">
          <div className="flex pr-2 flex-col gap-1 w-full">
            <div className="flex flex-col gap-2 mt-24 border-b border-white/10 pb-6">
              <div className="p-3 rounded-full bg-white/10 w-fit">
                <MessageCircle className="text-white/75" size={32} />
              </div>
              <h1 className="text-4xl font-bold">Welcome to Chat Diffusion</h1>
              <h2 className="text-white/75 text-xl mt-2">
                Talk directly to latent space.
              </h2>
            </div>
            {history.map((message, i) => (
              <Message key={i} message={message} />
            ))}
          </div>
        </div>
        <div>
          <div className="w-full px-4 py-3 mt-2 rounded-lg bg-white/10 flex flex-row items-center">
            <input
              type="text"
              className="w-full text-lg text-white/75 placeholder:text-white/30 outline-none bg-transparent"
              placeholder="Type what you want to see..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  makeImage();
                  e.preventDefault();
                }
              }}
              autoFocus
            />
            <button
              className={`shrink-0 ${
                prompt ? "cursor-pointer" : "cursor-default"
              }`}
              onClick={makeImage}
            >
              <Send
                className={`text-white rotate-45 ml-4 ${
                  prompt ? "hover:opacity-50" : "opacity-50"
                } duration-200`}
                size={20}
                fill="white"
              />
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

function Message({ message }: { message: Message }) {
  return (
    <>
      <div
        className={`flex flex-col my-2 w-full hover:bg-black/10 ${
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
        {message.images && message.images.length > 0 && (
          <div className="flex flex-row gap-1 max-h-[10rem] overflow-hidden">
            {message.images.map((image, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={image}
                alt="Generated image"
                className="shrink rounded mt-2"
                style={{
                  maxHeight: "10rem",
                  maxWidth: "10rem",
                  height: "512px",
                  width: "512px",
                }}
              />
            ))}
          </div>
        )}
        {message.prompt && message.type === "you" && (
          <p className="text-white/75">{message.prompt}</p>
        )}
        {message.loading && message.images && message.images.length === 0 && (
          <div className="flex flex-row gap-1 my-3">
            <div className="animate-pulse bg-white/75 w-3 h-3 rounded-full" />
            <div className="animate-pulse bg-white/75 w-3 h-3 rounded-full" />
            <div className="animate-pulse bg-white/75 w-3 h-3 rounded-full" />
          </div>
        )}
      </div>
    </>
  );
}
