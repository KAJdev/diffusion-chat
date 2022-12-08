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
        text_prompts: [
          {
            text: json.prompt,
            weight: 1,
          },
        ],
        samples: json.count || 1,
        sampler: "K_DPMPP_2S_ANCESTRAL",
        clip_guidance_preset: "FAST_BLUE",
        width: json.width || 512,
        height: json.height || 512,
        steps: json.steps || 30,
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
