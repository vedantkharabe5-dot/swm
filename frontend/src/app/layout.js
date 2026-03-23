import './globals.css';

export const metadata = {
  title: 'SmartWaste Pro — AI-Powered Waste Management Platform',
  description: 'Next-generation smart waste management system with IoT monitoring, AI route optimization, predictive analytics, and citizen engagement for sustainable cities.',
  keywords: 'smart waste management, IoT, AI, route optimization, recycling, sustainability',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0e1a" />
      </head>
      <body>{children}</body>
    </html>
  );
}
