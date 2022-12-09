// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextRequest } from "next/server";

export const config = {
  runtime: "experimental-edge",
};

// eslint-disable-next-line import/no-anonymous-default-export
export default async function (req: NextRequest) {
  if (req.method !== "POST" || !req.body) {
    return new Response(JSON.stringify({ error: "Invalid Request" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const json = await req.json();

  if (!json.prompt) {
    return new Response(JSON.stringify({ error: "Invalid Request" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const prompts = [
    {
      text: json.prompt,
      weight: 1,
    },
    {
      text: "amateur, poorly drawn, ugly, flat, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, blurry, bad anatomy, blurred, watermark, grainy, signature, cut off, draft",
      weight: -1,
    },
  ];

  if (json.modifiers) {
    prompts.push({
      text: json.modifiers,
      weight: 0.25,
    });
  }

  // make request to image api and return data
  const response = await fetch(
    `https://api.stability.ai/v1alpha/generation/${
      json.model || "stable-diffusion-v1-5"
    }/text-to-image`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.API_KEY || "",
        Accept: "application/json",
      },
      body: JSON.stringify({
        text_prompts: prompts,
        samples: json.count || 1,
        sampler: "K_DPMPP_2S_ANCESTRAL",
        clip_guidance_preset: "FAST_BLUE",
        width: json.width || 512,
        height: json.height || 512,
        steps: json.steps || 30,
        cfg_scale: 5,
      }),
    }
  );

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
    status: response.status,
  });
}
