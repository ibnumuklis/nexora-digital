import type { Metadata } from 'next';
import './globals.css';
import { Header,Footer } from '@/components/site-shell';
export const metadata:Metadata={title:{default:'NEXORA DIGITAL — Technology & Product Studio',template:'%s | NEXORA DIGITAL'},description:'Digital products, custom software development, and creative technology solutions.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/><main>{children}</main><Footer/></body></html>}
