'use client'

import Link from 'next/link';

export default async function InternalServerErrorPage() {
  return (
    <main className='h-full w-full flex flex-col items-center justify-center'>
      <h1 className='text-4xl font-bold'>500</h1>
      <h2 className='text-2xl font-bold'>Erro interno do servidor</h2>
      <p className='text-lg'>Desculpe, ocorreu um erro inesperado.</p>
      
      <Link
        href="/"
        className='mt-4 text-primary hover:underline'
      >
        Voltar para a página inicial
      </Link>
    </main>
  );
}