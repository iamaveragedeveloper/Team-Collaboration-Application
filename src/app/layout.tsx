import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: 'SynergySphere - Team Collaboration',
  description: 'A modern team collaboration application with project management and real-time chat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-800">
        {children}
      </body>
    </html>
  );
}
