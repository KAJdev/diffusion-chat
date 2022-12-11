/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  routes: {
    "image": async (request, env) => {
      if (request.method !== "POST" || !request.body) {
        return new Response(JSON.stringify({ error: "Invalid Request" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      const json = await request.json();

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
          weight: 0.75,
        },
      ];

      if (json.modifiers) {
        prompts.push({
          text: json.modifiers,
          weight: 0.75,
        });
      }

      if (json.prompt.length > 15) {
        prompts.push({
          text: "amateur, poorly drawn, ugly, flat, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, blurry, bad anatomy, blurred, watermark, grainy, signature, cut off, draft",
          weight: -0.5,
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
            Authorization: env.API_KEY || "",
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
            cfg_scale: 7,
          }),
        }
      );
      const data = await response.json();

      const toSend = [];

      console.log(data.artifacts.length);

      if (data.artifacts) {
        await Promise.all(
          data.artifacts.map(async (artifact) => {
            const key = `generations/${uuidv4()}.png`;
            await env.diffusionChatBucket.put(
              key,
              Uint8Array.from(atob(artifact.base64), (c) => c.charCodeAt(0)),
            );
            toSend.push({
              image: `https://cdn.diffusion.chat/${key}`,
              seed: artifact.seed,
            });
          })
        );
      }

      return new Response(JSON.stringify(toSend), {
        headers: {
          "Content-Type": "application/json",

          // Required for CORS support to work
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
          "Access-Control-Max-Age": "86400",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Expose-Headers": "Content-Type",
        },
        status: response.status,
      });
    },
  },

  async fetch(request, env) {
    // handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",

          // Required for some pre-flight requests
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const route = this.routes[url.pathname.slice(1)];

    if (route) {
      return route(request, env);
    }

    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
};
