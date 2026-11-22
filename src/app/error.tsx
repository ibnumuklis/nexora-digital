'use client';
import { useEffect } from 'react';import { RefreshCw } from 'lucide-react';
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>{console.error(error)},[error]);return <div className="grid min-h-[65vh] place-items-center px-5 text-center"><div><h1 className="text-3xl font-semibold text-forest">Something went wrong</h1><p className="mt-3 text-sm text-slate-500">The page could not be loaded. Please try again.</p><button onClick={()=>reset()} className="btn-dark mt-7"><RefreshCw size={15}/> Try again</button></div></div>}
