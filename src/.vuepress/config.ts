import { viteBundler } from "@vuepress/bundler-vite";
import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "程序员不鸭",
  description: "Java + AI Agent 开发实践知识库",

  // 标签页 favicon + ccswitch 风格字体
  // ponytail: Google Fonts 在国内慢且 render-blocking，用 media=print onload 老技巧转非阻塞；中文走系统字体不拉远程（Noto Sans SC woff2 太大）
  head: [
    ["link", { rel: "icon", href: "/logo.png" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap",
        media: "print",
        onload: "this.onload=null;this.media='all'",
      },
    ],
  ],

  bundler: viteBundler(),

  theme,
});
