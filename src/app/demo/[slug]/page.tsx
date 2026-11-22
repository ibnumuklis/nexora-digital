import { notFound } from 'next/navigation';
import { products } from '@/lib/data';
import DemoClient from '@/components/demo-client';
export default async function DemoPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=products.find(x=>x.slug===slug);if(!p)notFound();return <DemoClient product={p}/>;}
