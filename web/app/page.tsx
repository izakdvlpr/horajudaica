'use client'

import { z } from 'zod'
import { useForm } from "react-hook-form"
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscriberAction } from '@/actions/subscriber'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigátorio'),
  email: z.string().email('E-mail é obrigátorio'),
})

type FormData = z.infer<typeof schema>

export default function HomePage() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });
  
  async function handleSubscriber(formData: FormData) {
    const { name, email } = formData
    
    const subscriber = await subscriberAction({ name, email })
    
    if (subscriber?.error) {
      toast.error(subscriber.error)
      
      return
    }
    
    form.reset();
    
    toast.success('Inscrição realizada com sucesso!')
  }
  
  return (
    <main className="h-screen w-full flex flex-col items-center justify-center gap-4">
      <span className='text-8xl'>🇮🇱</span>
      
      <h1 className="text-2xl font-bold text-center">
        Receba diariamente a <br /> Contagem do Ômer no seu e-mail
      </h1>
      
      <h2 className="text-sm">
        Incluindo a bênção e a Contagem exata para cada dia.
      </h2>
      
      <form
        className='max-w-xs w-full flex flex-col gap-4'
        onSubmit={form.handleSubmit(handleSubscriber)}
      >
        <fieldset className='flex flex-col space-y-2'>
          <Input 
            id="name"
            type="text"
            placeholder='Informe seu nome'
            {...form.register('name')}
          />
          
          {form.formState.errors.name && (
            <p className="text-red-400 text-xs">{form.formState.errors.name.message}</p>
          )}
        </fieldset>
        
        <fieldset className='flex flex-col space-y-2'>
          <Input 
            id="email"
            type="email"
            placeholder='Informe seu e-mail'
            {...form.register('email')}
          />
          
          {form.formState.errors.email && (
            <p className="text-red-400 text-xs">{form.formState.errors.email.message}</p>
          )}
        </fieldset>
        
        <Button
          type="submit"
          size="lg"
          className="w-full cursor-pointer"
          disabled={form.formState.isSubmitting}
        >
          Inscreva-se
        </Button>
        
        <div className='text-center text-[10px] text-zinc-500'>
          Ao continuar, você concorda com nossos <br />
          <Link href="/terms" className='font-bold text-primary underline'>Termos de Serviço</Link>
          {" "}e{" "}
          <Link href="/privacy" className='font-bold text-primary underline'>Política de Privacidade</Link>
        </div>
      </form>
    </main>
  )
}