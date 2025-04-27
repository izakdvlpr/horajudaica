import { NextRequest, NextResponse } from 'next/server';
import { MongoDB, OneSignal } from '@horajudaica/subscriptions'
import { getOmerToday } from '@horajudaica/dates';
import { z } from 'zod';

import { type GeoData, getIp, getGeoData } from '@/lib/geo'
import { blockAction } from '@/lib/ratelimit'

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
    
    if (process.env.NODE_ENV === 'production') {
      const ip = await getIp()
      
      if (ip) {
        geoData = await getGeoData(ip)
        
        const ratelimit = await blockAction(ip);
      
        if (ratelimit.error) {
          return NextResponse.json({ success: false, error: ratelimit.error }, { status: 429 })
        }
      }
    }
    
    const user = await MongoDB.findUserByEmail(userEmail)
    
    const templateId = OneSignal.Templates[subscriptionType as keyof typeof OneSignal.Templates]
    
    /**
     * Se não existe usuário
     * 
     * - Cria usuário no MongoDB
     * - Cria inscrição no MongoDB
     * - Vincula inscrição ao usuário no MongoDB
     * - Cria usuário no OneSignal
     * - Atualiza usuário no MongoDB com o IDs do OneSignal
     * - Cria notificação no OneSignal
     * - Atualiza inscrição no MongoDB com a data do último envio
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
        userCreated._id.toString(),
        subscriptionCreated._id.toString()
      )
      
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
      
      const oneSignalSubscriptionId = oneSignalUserCreated.subscriptions?.find(s => s.type === 'Email')?.id as string
      const oneSignalUserId = oneSignalUserCreated.identity?.onesignal_id as string
      
      await MongoDB.updateUserById(userCreated._id.toString(), {
        oneSignal: {
          userId: oneSignalUserId,
          subscriptionId: oneSignalSubscriptionId
        }
      })
      
      const omerToday = await getOmerToday();
     
      await OneSignal.createEmailNotification({
        templateId,
        subscriptionId: oneSignalSubscriptionId,
        subject: `Hora Judaica | Contagem do Ômer - Dia ${omerToday?.diaDoOmer}`,
        customData: {
          'diaDoOmer': omerToday?.diaDoOmer,
          'dataGregoriana': omerToday?.dataGregoriana,
          'dataJudaica': omerToday?.dataJudaica,
          'semanasDias': omerToday?.semanasDias,
          'pronuncia': omerToday?.pronuncia,
          'subscriptionType': subscriptionType
        }
      })
      
      await MongoDB.updateSubscriptionById(subscriptionCreated._id.toString(), {
        lastSentAt: new Date(),
      })
      
      return NextResponse.json({ success: true })
    }
    
    const subscription = (user.subscriptions as MongoDB.SubscriptionDocument[]).find((s) => s.type === subscriptionType)
    
    /**
     * Se já existe usuário porém não tem inscrição com aquele tipo
     * 
     * - Cria inscrição no MongoDB
     * - Vincula inscrição ao usuário no MongoDB
     * - Atualiza o tipo nas tags do usuário no OneSignal
     * - Cria notificação no OneSignal
     * - Atualiza inscrição no MongoDB com a data do último envio
     */
    if (!subscription) {
      const subscriptionCreated = await MongoDB.createSubscription({
        type: subscriptionType,
        enabled: true,
        user: user._id
      })
      
      await MongoDB.addSubscriptionToUser(
        user._id.toString(),
        subscriptionCreated._id.toString()
      )
      
      const oneSignalUser = await OneSignal.findUserByEmail(userEmail)
      
      const oneSignalUserId = user.oneSignal?.userId as string
      const oneSignalSubscriptionId = user.oneSignal?.subscriptionId as string
      
      await OneSignal.updateUserById(oneSignalUserId, {
        tags: {
          ...oneSignalUser?.properties?.tags,
          [subscriptionType]: 'true',
        } 
      })
      
      const omerToday = await getOmerToday();
      
      await OneSignal.createEmailNotification({
        templateId,
        subscriptionId: oneSignalSubscriptionId,
        subject: `Hora Judaica | Contagem do Ômer - Dia ${omerToday?.diaDoOmer}`,
        customData: {
          'diaDoOmer': omerToday?.diaDoOmer,
          'dataGregoriana': omerToday?.dataGregoriana,
          'dataJudaica': omerToday?.dataJudaica,
          'semanasDias': omerToday?.semanasDias,
          'pronuncia': omerToday?.pronuncia,
          'subscriptionType': subscriptionType
        }
      })
      
      await MongoDB.updateSubscriptionById(subscriptionCreated._id.toString(), {
        lastSentAt: new Date(),
      })
      
      return NextResponse.json({ success: true })
    }
    
    /**
     * Se já existe usuário e inscrição, porém não está habilitada e tem a data de cancelamento
     * 
     * - Atualiza inscrição no MongoDB
     * - Atualiza o tipo nas tags do usuário no OneSignal
     * - Cria notificação no OneSignal
     * - Atualiza inscrição no MongoDB com a data do último envio
     */
    if (!subscription.enabled && subscription.unsubscribedAt) {
      await MongoDB.updateSubscriptionById(subscription._id.toString(), {
        enabled: true,
        unsubscribedAt: null
      })
      
      const oneSignalUser = await OneSignal.findUserByEmail(userEmail)
      
      const oneSignalUserId = user.oneSignal?.userId as string
      const oneSignalSubscriptionId = user.oneSignal?.subscriptionId as string
      
      await OneSignal.updateUserById(oneSignalUserId, {
        tags: {
          ...oneSignalUser?.properties?.tags,
          [subscriptionType]: 'true',
        } 
      })
      
      const omerToday = await getOmerToday();
      
      await OneSignal.createEmailNotification({
        templateId,
        subscriptionId: oneSignalSubscriptionId,
        subject: `Hora Judaica | Contagem do Ômer - Dia ${omerToday?.diaDoOmer}`,
        customData: {
          'diaDoOmer': omerToday?.diaDoOmer,
          'dataGregoriana': omerToday?.dataGregoriana,
          'dataJudaica': omerToday?.dataJudaica,
          'semanasDias': omerToday?.semanasDias,
          'pronuncia': omerToday?.pronuncia,
          'subscriptionType': subscriptionType
        }
      })
      
      await MongoDB.updateSubscriptionById(subscription._id.toString(), {
        lastSentAt: new Date(),
      })
      
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
    
    const subscription = (user.subscriptions as MongoDB.SubscriptionDocument[]).find((s) => s.type === subscriptionType)
    
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
    
    await MongoDB.updateSubscriptionById(subscription._id.toString(), {
      enabled: false,
      unsubscribedAt: new Date()
    })
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    
    return NextResponse.json({ success: false, message: 'Erro ao inscrever-se.' }, { status: 500 })
  }
}