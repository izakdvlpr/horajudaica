import { NextRequest, NextResponse } from 'next/server';
import { MongoDB, OneSignal } from '@horajudaica/subscriptions'
import { getOmerToday } from '@horajudaica/dates';
import { z } from 'zod';

import { type GeoData, getIp, getGeoData } from '@/lib/geo'
import { createRateLimit } from '@/lib/ratelimit'
import { isProdMode } from '@/lib/utils';

function isCronTimeOverToSendEmail() {
  const now = new Date();
  const offsetSP = -3 * 60; // UTC-3 para São Paulo
  const nowSP = new Date(now.getTime() + (offsetSP + now.getTimezoneOffset()) * 60000);
  
  const hours = nowSP.getHours();
  const minutes = nowSP.getMinutes();
  const seconds = nowSP.getSeconds();

  if (hours >= 18 && hours <= 23) {
    if (hours === 23) {
      return minutes <= 59 && seconds <= 59;
    }
    
    return true;
  }
  
  return false;
}

async function sendContagemDoOmerEmail(oneSignalSubscriptionId: string) {
  const omerToday = await getOmerToday();
     
  await OneSignal.createEmailNotification({
    templateId: OneSignal.Templates['contagem-do-omer'],
    subscriptionId: oneSignalSubscriptionId,
    subject: `Hora Judaica | Contagem do Ômer - Dia ${omerToday?.diaDoOmer}`,
    customData: {
      diaDoOmer: omerToday?.diaDoOmer,
      dataGregoriana: omerToday?.dataGregoriana,
      dataJudaica: omerToday?.dataJudaica,
      semanasDias: omerToday?.semanasDias,
      pronuncia: omerToday?.pronuncia,
      subscriptionType: 'contagem-do-omer'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const schema = z.object({
      subscriptionType: z.nativeEnum(MongoDB.SubscriptionType),
      userEmail: z.string().email({ message: 'Email inválido.' })
    })
    
    const { success, data } = schema.safeParse(body)
  
    if (!success) {
      return NextResponse.json({ success: false, message: 'Dados inválidos.' }, { status: 422 })
    }
    
    const { subscriptionType, userEmail } = data
    
    let geoData: GeoData | null = null
    
    if (isProdMode()) {
      const ip = await getIp()
      
      if (ip) {
        geoData = await getGeoData(ip)
        
        const ratelimit = await createRateLimit(ip);
      
        if (!ratelimit.success) {
          return NextResponse.json({ success: false, message: ratelimit.message }, { status: 429 })
        }
      }
    }
    
    const user = await MongoDB.findUserByEmail(userEmail)
    
    /**
     * Se não existe usuário
     * 
     * - Cria usuário no MongoDB
     * - Cria inscrição no MongoDB
     * - Vincula inscrição ao usuário no MongoDB
     * - Cria usuário no OneSignal
     * - Atualiza usuário no MongoDB com os IDs do OneSignal
     * - Cria notificação no OneSignal se for entre 18:00 e 23:59
     */
    if (!user) {
      const userCreated = await MongoDB.createUser({
        email: userEmail
      })
      
      const subscriptionCreated = await MongoDB.createSubscription({
        type: subscriptionType,
        enabled: true,
        user: userCreated._id
      })
      
      await MongoDB.addSubscriptionToUser(
        userCreated._id,
        subscriptionCreated._id
      ).then(data => console.log('addSubscriptionToUser', data))
      
      const oneSignalUserCreated = await OneSignal.createUser({
        email: userEmail,
        tags: {
          [MongoDB.SubscriptionType.CONTAGEM_DO_OMER]: String(subscriptionType === MongoDB.SubscriptionType.CONTAGEM_DO_OMER),
          [MongoDB.SubscriptionType.PARASHA_SEMANAL]: String(subscriptionType === MongoDB.SubscriptionType.PARASHA_SEMANAL),
          [MongoDB.SubscriptionType.HORARIOS_DO_SHABAT]: String(subscriptionType === MongoDB.SubscriptionType.HORARIOS_DO_SHABAT),
        },
        ip: geoData?.ip,
        lat: geoData?.lat,
        long: geoData?.lon,
        timeZone: geoData?.timezone,
      })
      
      const oneSignalUserId = oneSignalUserCreated.identity?.onesignal_id as string
      const oneSignalSubscriptionId = oneSignalUserCreated.subscriptions?.find(s => s.type === 'Email')?.id as string
      
      await MongoDB.updateUserById(userCreated._id, {
        oneSignal: {
          userId: oneSignalUserId,
          subscriptionId: oneSignalSubscriptionId
        }
      })
      
      if (isCronTimeOverToSendEmail() && subscriptionType === MongoDB.SubscriptionType.CONTAGEM_DO_OMER) {
        await sendContagemDoOmerEmail(oneSignalSubscriptionId)
      }
      
      return NextResponse.json({ success: true })
    }
    
    const subscription = await MongoDB.findSubscriptionByTypeAndUserId(subscriptionType, user._id)
    
    /**
     * Se já existe usuário porém não tem inscrição com aquele tipo
     * 
     * - Cria inscrição no MongoDB
     * - Vincula inscrição ao usuário no MongoDB
     * - Atualiza o tipo nas tags do usuário no OneSignal
     * - Cria notificação no OneSignal se for entre 18:00 e 23:59
     */
    if (!subscription) {
      const subscriptionCreated = await MongoDB.createSubscription({
        type: subscriptionType,
        enabled: true,
        user: user._id
      })
      
      await MongoDB.addSubscriptionToUser(
        user._id,
        subscriptionCreated._id
      )
      
      const oneSignalUser = await OneSignal.findUserByEmail(userEmail)
      
      await OneSignal.updateUserById(user.oneSignal?.userId as string, {
        tags: {
          ...oneSignalUser?.properties?.tags,
          [subscriptionType]: 'true',
        } 
      })
      
      if (isCronTimeOverToSendEmail() && subscriptionType === MongoDB.SubscriptionType.CONTAGEM_DO_OMER) {
        await sendContagemDoOmerEmail(user.oneSignal?.subscriptionId as string)
      }
      
      return NextResponse.json({ success: true })
    }
    
    /**
     * Se já existe usuário e inscrição, porém não está habilitada e tem a data de cancelamento
     * 
     * - Atualiza inscrição no MongoDB
     * - Atualiza o tipo nas tags do usuário no OneSignal
     * - Cria notificação no OneSignal se for entre 18:00 e 23:59
     */
    if (!subscription.enabled && subscription.unsubscribedAt) {
      await MongoDB.updateSubscriptionById(subscription._id, {
        enabled: true,
        unsubscribedAt: null
      })
      
      const oneSignalUser = await OneSignal.findUserByEmail(userEmail)
      
      await OneSignal.updateUserById(user.oneSignal?.userId as string, {
        tags: {
          ...oneSignalUser?.properties?.tags,
          [subscriptionType]: 'true',
        } 
      })
      
      if (isCronTimeOverToSendEmail() && subscriptionType === MongoDB.SubscriptionType.CONTAGEM_DO_OMER) {
        await sendContagemDoOmerEmail(user.oneSignal?.subscriptionId as string)
      }
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ success: false, message: 'Email já cadastrado.' }, { status: 409 })
  } catch (err) {
    console.error(err)
    
    return NextResponse.json({ success: false, message: 'Erro ao inscrever-se.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    const schema = z.object({
      subscriptionType: z.nativeEnum(MongoDB.SubscriptionType),
      oneSignalSubscriptionId: z.string().min(1, { message: 'ID é obrigatório.' }),
    })
    
    const { success, data } = schema.safeParse(body)
  
    if (!success) {
      return NextResponse.json({ success: false, message: 'Dados inválidos.' }, { status: 422 })
    }
    
    const { subscriptionType, oneSignalSubscriptionId } = data
    
    const user = await MongoDB.findUserByOneSignalSubscriptionId(oneSignalSubscriptionId)
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'Inscrição não encontrada.' }, { status: 404 })
    }
    
    const subscription = await MongoDB.findSubscriptionByTypeAndUserId(subscriptionType, user._id)
    
    if (!subscription) {
      return NextResponse.json({ success: false, message: 'Inscrição não encontrada.' }, { status: 404 })
    }
    
    if (!subscription.enabled && subscription.unsubscribedAt) {
      return NextResponse.json({ success: false, message: 'Inscrição já cancelada.' }, { status: 409 })
    }
    
    const oneSignalUserId = user.oneSignal?.userId as string
    
    const oneSignalUser = await OneSignal.findUserById(oneSignalUserId)
    
    await OneSignal.updateUserById(oneSignalUserId, {
      tags: {
        ...oneSignalUser?.properties?.tags,
        [subscriptionType]: 'false',
      } 
    })
    
    await MongoDB.updateSubscriptionById(subscription._id, {
      enabled: false,
      unsubscribedAt: new Date()
    })
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    
    return NextResponse.json({ success: false, message: 'Erro ao inscrever-se.' }, { status: 500 })
  }
}