import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs-dist) yüklerken kendi pdf.worker.mjs dosyasını Node'un
  // gerçek node_modules yolunda arar; Turbopack bu paketi bundle edip chunk'a
  // gömerse o yol artık diskte var olmadığı için "Setting up fake worker
  // failed" ile patlıyor (Server Action içinde /statements/import akışında
  // uçtan uca test edilirken tespit edildi). Native require ile yüklensin.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
