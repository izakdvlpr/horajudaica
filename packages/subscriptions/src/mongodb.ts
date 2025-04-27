import mongoose from 'mongoose';

declare global {
  var mongoose: mongoose.Mongoose | null;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = null;
}

export namespace MongoDB {
  export async function connectToMongo() {
    if (cached) return cached
    
    try {
      cached = await mongoose.connect(process.env.MONGODB_URL!, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000
      })
      
      return cached
    } catch (err) {
      console.error(err)
      
      throw new Error('MongoDB connection error')
    }
  }
  
  export interface UserDocument extends mongoose.Document {
    _id: mongoose.Types.ObjectId
    email: string
    oneSignal: {
      userId: string | null
      subscriptionId: string | null
    }
    subscriptions: mongoose.Types.ObjectId[] | SubscriptionDocument[];
    createdAt: Date
  }
  
  export const SubscriptionType = {
    CONTAGEM_DO_OMER: 'contagem-do-omer',
    PARASHA_SEMANAL: 'parasha-semanal',
    HORARIOS_DO_SHABAT: 'horarios-do-shabat'
  } as const
  
  export type SubscriptionType = typeof SubscriptionType[keyof typeof SubscriptionType]
  
  export interface SubscriptionDocument extends mongoose.Document {
    _id: mongoose.Types.ObjectId
    type: SubscriptionType
    enabled: boolean
    user?: mongoose.Types.ObjectId | UserDocument
    lastSentAt: Date | null
    subscribedAt: Date
    unsubscribedAt: Date | null
  }
  
  export const UserSchema = new mongoose.Schema<UserDocument>(
    {
      email: { type: String, required: true, unique: true },
      oneSignal: {
        userId: { type: String, required: false, default: null },
        subscriptionId: { type: String, required: false, default: null }
      },
      subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'subscriptions' }],
      createdAt: { type: Date, default: new Date() }
    },
    {
      timestamps: false,
      collection: 'users'
    }
  )
  
  export const SubscriptionSchema = new mongoose.Schema<SubscriptionDocument>(
    {
      type: { type: String, enum: Object.values(SubscriptionType), required: true },
      enabled: { type: Boolean, required: true, default: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
      lastSentAt: { type: Date, required: false, default: null },
      unsubscribedAt: { type: Date, required: false, default: null },
      subscribedAt: { type: Date, required: true, default: new Date() },
    },
    {
      timestamps: false,
      collection: 'subscriptions'
    }
  )
  
  export const UserModel = (mongoose.models?.users || mongoose.model<UserDocument>('users', UserSchema)) as mongoose.Model<UserDocument>
  
  export const SubscriptionModel = (mongoose.models?.subscriptions || mongoose.model<SubscriptionDocument>('subscriptions', SubscriptionSchema)) as mongoose.Model<SubscriptionDocument>
  
  export async function createUser(
    data: Pick<UserDocument, 'email'>
  ): Promise<UserDocument> {
    await connectToMongo()
    
    await UserModel.create(data)
    
    const user = await UserModel.findOne({ email: data.email }).populate('subscriptions').lean()
    
    return user as UserDocument
  }
  
  export async function findUserByEmail(email: string): Promise<UserDocument | null> {
    await connectToMongo()
   
    const user = await UserModel.findOne({ email }).populate('subscriptions').lean()

    return user ?? null
  }
  
  export async function findUserByOneSignalSubscriptionId(oneSignalSubscriptionId: string): Promise<UserDocument | null> {
    await connectToMongo()
   
    const user = await UserModel.findOne({ 'oneSignal.subscriptionId': oneSignalSubscriptionId }).populate('subscriptions').lean()

    return user ?? null
  }
  
  export async function updateUserById(
    id: string,
    data: Partial<Pick<UserDocument, 'oneSignal'>>
  ): Promise<UserDocument> {
    await connectToMongo()
    
    await UserModel.updateOne({ _id: id }, data)
    
    const user = await UserModel.findById(id).populate('subscriptions').lean()
    
    return user as UserDocument
  }
  
  export async function addSubscriptionToUser(userId: string, subscriptionId: string): Promise<UserDocument> {
    await connectToMongo()
    
    await UserModel.updateOne({ _id: userId }, {
      $push: { subscriptions: subscriptionId }
    })
    
    const user = await UserModel.findById(userId).populate('subscriptions').lean()
    
    return user as UserDocument
  }
  
  export async function createSubscription(
    data: Pick<SubscriptionDocument, 'type' | 'enabled' | 'user'>
  ): Promise<SubscriptionDocument> {
    await connectToMongo()
    
    await SubscriptionModel.create(data)
    
    const subscription = await SubscriptionModel.findOne({ type: data.type }).populate('user').lean()
    
    return subscription as SubscriptionDocument
  }
  
  export async function findSubscriptionById(id: string): Promise<SubscriptionDocument | null> {
    await connectToMongo()
    
    const subscription = await SubscriptionModel.findById(id).populate('user').lean()
    
    return subscription ?? null
  }
  
  export async function updateSubscriptionById(
    id: string,
    data: Partial<Pick<SubscriptionDocument, 'enabled' | 'lastSentAt' | 'unsubscribedAt'>>
  ): Promise<SubscriptionDocument> {
    await connectToMongo()
    
    await SubscriptionModel.updateOne({ _id: id }, data)
    
    const subscription = await SubscriptionModel.findById(id).populate('user').lean()
    
    return subscription as SubscriptionDocument
  }
}
