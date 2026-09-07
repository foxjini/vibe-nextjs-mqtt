import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VIBE MQTT 2026 // 스마트 한국어 음성 감응 시스템',
  description: 'MQTT 브로커 연동 실시간 토픽 감응형 밝고 명랑한 한국어 TTS 음성 안내 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-[#07090e] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
