import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://llyVictory.github.io",

  author: {
    name: "程序员不鸭",
    url: "https://github.com/llyVictory",
  },

  repo: "llyVictory/llyVictory.github.io",

  docsDir: "src",

  // 左上角导航栏 logo
  logo: "/logo.png",

  // 导航栏
  navbar,

  // 侧边栏
  sidebar,

  // 页脚
  footer: "程序员不鸭 · Java + AI Agent 开发实践知识库",
  displayFooter: true,

  // 多语言配置
  metaLocales: {
    editLink: "在 GitHub 上编辑此页",
  },

  // 代码块：复制按钮、行号、行高亮
  markdown: {
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    spoiler: true,
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,

    // 按需启用：第一篇用到的文章再装依赖并取消注释
    // math: { type: "katex" },   // 需安装 katex
    // mermaid: true,             // 需安装 mermaid
    // chartjs: true,             // 需安装 chart.js
    // echarts: true,             // 需安装 echarts
    // flowchart: true,           // 需安装 flowchart.ts
  },

  plugins: {
    components: {
      components: ["Badge", "VPCard"],
    },

    icon: {
      prefix: "fa6-solid:",
    },

    // ponytail: 评论(Giscus)/PWA/DocSearch 等第一篇真需要时再加，现在配是投机脚手架
  },
});
