import type { Metadata } from 'next';
import { Archivo, Montserrat, Poppins } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import { AppHeader } from '@/shared/components/app-header';
import './globals.css';

const archivo = Archivo({ variable: '--font-archivo', subsets: ['latin'] });
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRM Nobre Brindes',
  description: 'Funil de oportunidades e fila de retorno do dia da equipe comercial.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${poppins.variable} ${montserrat.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <AppProviders>
          <AppHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
