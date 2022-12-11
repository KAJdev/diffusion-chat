import { AnimatePresence, motion } from "framer-motion";
import create from "zustand";

export function Settings() {
  const [open, settings, setSettings] = Settings.use((state) => [
    state.isOpen,
    state.settings,
    state.setSettings,
  ]);

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
        <div className="flex flex-row gap-2 p-1 rounded-lg bg-white/5 border border-white/10 w-fit">
          {["1.5", "2.1", "2.1 large"].map((model) => (
            <button
              key={model}
              className={`rounded flex justify-center relative font-semibold px-2 items-center ${
                settings.model ===
                (model === "1.5"
                  ? "stable-diffusion-v1-5"
                  : model === "2.1"
                  ? "stable-diffusion-512-v2-1"
                  : "stable-diffusion-768-v2-1")
                  ? "text-white"
                  : "hover:text-white text-white/75"
              }`}
              onClick={() => {
                setSettings({
                  ...settings,
                  model:
                    model === "1.5"
                      ? "stable-diffusion-v1-5"
                      : model === "2.1"
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
              {settings.model ===
                (model === "1.5"
                  ? "stable-diffusion-v1-5"
                  : model === "2.1"
                  ? "stable-diffusion-512-v2-1"
                  : "stable-diffusion-768-v2-1") &&
                open && (
                  <motion.div
                    layoutId="model"
                    transition={{ duration: 0.1 }}
                    className="absolute inset-0 rounded bg-white/10"
                    initial={false}
                  />
                )}
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

export type Settings = {
  model:
    | "stable-diffusion-v1-5"
    | "stable-diffusion-512-v2-1"
    | "stable-diffusion-768-v2-1";
  width: number;
  height: number;
  count: number;
  steps: number;
};

export type SettingsState = {
  settings: Settings;
  setSettings: (settings: Settings) => void;

  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};

export namespace Settings {
  export const use = create<SettingsState>()((set) => ({
    settings: {
      model: "stable-diffusion-v1-5",
      width: 512,
      height: 512,
      count: 4,
      steps: 30,
    } as Settings,
    setSettings: (settings: Settings) =>
      set((state: SettingsState) => ({
        settings: { ...state.settings, ...settings },
      })),

    isOpen: false,
    setOpen: (isOpen: boolean) => set((state: SettingsState) => ({ isOpen })),
  }));
}
