import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";
import { defineConfig, loadEnv } from "vite";
import vinext from "vinext";

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const apiUrl = loadEnv(mode, process.cwd(), "NEXT_PUBLIC_").NEXT_PUBLIC_API_URL?.trim();
    if (!apiUrl) {
      throw new Error("Set NEXT_PUBLIC_API_URL to the deployed FastAPI URL before building the Mentor Worker.");
    }
    const parsed = new URL(apiUrl);
    if (
      parsed.protocol !== "https:" ||
      /^(localhost|.*\.localhost|127(?:\.\d+){3}|\[::1\]|0\.0\.0\.0)$/i.test(parsed.hostname) ||
      parsed.username || parsed.password || parsed.search || parsed.hash
    ) {
      throw new Error("NEXT_PUBLIC_API_URL must be an HTTPS backend URL without credentials, query parameters, or a fragment; localhost is for development only.");
    }
  }

  return {
    plugins: [
      vinext({
        images: { optimizer: imagesOptimizer() },
      }),
      cloudflare({
        viteEnvironment: {
          name: "rsc",
          childEnvironments: ["ssr"],
        },
      }),
    ],
  };
});
