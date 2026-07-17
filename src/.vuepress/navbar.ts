import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Java 后端",
    prefix: "/java/",
    children: [
      { text: "Java 基础", prefix: "basis/", link: "basis/" },
      { text: "并发编程", prefix: "concurrent/", link: "concurrent/" },
      { text: "JVM", prefix: "jvm/", link: "jvm/" },
      { text: "Spring", prefix: "spring/", link: "spring/" },
    ],
  },
  {
    text: "中间件",
    prefix: "/middleware/",
    children: [
      { text: "Redis", prefix: "redis/", link: "redis/" },
      { text: "消息队列", prefix: "mq/", link: "mq/" },
    ],
  },
  {
    text: "AI 应用开发",
    prefix: "/ai/",
    children: [
      { text: "大模型基础", prefix: "llm/", link: "llm/" },
      { text: "Agent", prefix: "agent/", link: "agent/" },
      { text: "RAG", prefix: "rag/", link: "rag/" },
    ],
  },
  {
    text: "基础设施",
    prefix: "/infra/",
    children: [
      { text: "Docker", prefix: "docker/", link: "docker/" },
      { text: "Kubernetes", prefix: "k8s/", link: "k8s/" },
    ],
  },
  {
    text: "关于",
    link: "/about.html",
  },
]);
