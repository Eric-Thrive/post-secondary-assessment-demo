import type { Config } from "tailwindcss";
import rootConfig from "../../tailwind.config";

export default {
  ...rootConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
} satisfies Config;
