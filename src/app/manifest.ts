import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Veli Backoffice",
    short_name: "Veli",
    description: "Gestão de pedidos, alunos, turmas e operações da Veli.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#0b4fc5",
    orientation: "any",
    categories: ["business", "education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Resumo rápido",
        short_name: "Resumo",
        description: "Pedidos e alunos ativos",
        url: "/resumo?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Pedidos",
        short_name: "Pedidos",
        url: "/orders?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
