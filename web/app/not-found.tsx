import Link from 'next/link';

export default async function NotFoundErrorPage() {
  return (
    <main className='h-full w-full flex flex-col items-center justify-center'>
      <h1 className='text-4xl font-bold'>404</h1>
      <h2 className='text-2xl font-bold'>Não encontrado</h2>
      <p className='text-lg'>Desculpe, não conseguimos encontrar o que você estava procurando.</p>
      
      <Link
        href='/'
        className='mt-4 text-primary hover:underline'
      >
        Voltar para a página inicial
      </Link>
    </main>
  );
}