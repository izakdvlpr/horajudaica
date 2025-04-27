'use client'

import { toast } from 'sonner'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import axios, { isAxiosError } from 'axios'

import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(false);
  
  async function handleUnsubscribe() {
    setLoading(true)
    
    try {
      await axios.delete('/api/subscriptions', {
        data: {
          subscriptionType: searchParams?.get('subscriptionType'),
          oneSignalSubscriptionId: params?.id,
        }
      })
      
      toast.success('Desinscrição realizada com sucesso!')
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? err.response?.data?.message
          : 'Erro ao cadastrar.'
      )
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (!params?.id || !searchParams?.has('subscriptionType')) {
      router.push('/')
    }
  }, [params, searchParams])
  
  return (
    <main className="h-screen w-full flex flex-col items-center justify-center gap-4">
      <h2 className="text-lg">
        Você não receberá mais e-mails.
      </h2>
        
      <Button
        type="submit"
        size="lg"
        className="max-w-xs w-full cursor-pointer bg-red-500 hover:bg-red-600 text-white"
        disabled={loading}
        onClick={handleUnsubscribe}
      >
        {loading ? 'Desinscrevendo...' : 'Desinscrever'}
      </Button>
    </main>
  )
}