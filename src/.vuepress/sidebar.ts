import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    {
      text: "Java 后端",
      icon: "language",
      prefix: "java/",
      link: "java/",
      children: "structure",
    },
    {
      text: "中间件",
      icon: "layer-group",
      prefix: "middleware/",
      link: "middleware/",
      children: "structure",
    },
    {
      text: "AI 应用开发",
      icon: "robot",
      prefix: "ai/",
      link: "ai/",
      children: "structure",
    },
    {
      text: "基础设施",
      icon: "server",
      prefix: "infra/",
      link: "infra/",
      children: "structure",
    },
    "about",
  ],
});
