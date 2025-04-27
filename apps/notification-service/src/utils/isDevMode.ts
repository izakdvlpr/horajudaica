import { Resource } from 'sst';

export const isDevMode = Resource.App.stage === 'development'