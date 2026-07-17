import { viteBundler } from "@vuepress/bundler-vite";
import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "程序员不鸭",
  description: "Java + AI Agent 开发实践知识库",

  // 标签页 favicon
  head: [["link", { rel: "icon", href: "/logo.png" }]],

  bundler: viteBundler(),

  theme,
});
