import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Java 后端",
    icon: "language",
    prefix: "/java/",
    children: [
      {
        text: "Java 基础",
        icon: "book",
        prefix: "basis/",
        link: "basis/",
      },
      {
        text: "并发编程",
        icon: "bars-staggered",
        prefix: "concurrent/",
        link: "concurrent/",
      },
      {
        text: "JVM",
        icon: "microchip",
        prefix: "jvm/",
        link: "jvm/",
      },
      {
        text: "Spring",
        icon: "leaf",
        prefix: "spring/",
        link: "spring/",
      },
    ],
  },
  {
    text: "中间件",
    icon: "layer-group",
    prefix: "/middleware/",
    children: [
      {
        text: "Redis",
        icon: "database",
        prefix: "redis/",
        link: "redis/",
      },
      {
        text: "消息队列",
        icon: "envelopes-bulk",
        prefix: "mq/",
        link: "mq/",
      },
    ],
  },
  {
    text: "AI 应用开发",
    icon: "robot",
    prefix: "/ai/",
    children: [
      {
        text: "大模型基础",
        icon: "brain",
        prefix: "llm/",
        link: "llm/",
      },
      {
        text: "Agent",
        icon: "robot",
        prefix: "agent/",
        link: "agent/",
      },
      {
        text: "RAG",
        icon: "magnifying-glass",
        prefix: "rag/",
        link: "rag/",
      },
    ],
  },
  {
    text: "基础设施",
    icon: "server",
    prefix: "/infra/",
    children: [
      {
        text: "Docker",
        icon: "docker",
        prefix: "docker/",
        link: "docker/",
      },
      {
        text: "Kubernetes",
        icon: "dharmachakra",
        prefix: "k8s/",
        link: "k8s/",
      },
    ],
  },
  {
    text: "关于",
    icon: "circle-info",
    link: "/about.html",
  },
]);
