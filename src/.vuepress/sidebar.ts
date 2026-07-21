import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    {
      text: "Java 后端",
      prefix: "java/",
      link: "java/",
      children: "structure",
    },
    {
      text: "中间件",
      prefix: "middleware/",
      link: "middleware/",
      children: "structure",
    },
    {
      text: "AI 应用开发",
      prefix: "ai/",
      link: "ai/",
      children: "structure",
    },
    {
      text: "基础设施",
      prefix: "infra/",
      link: "infra/",
      children: "structure",
    },
    "about",
  ],
});
