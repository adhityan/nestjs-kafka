import { ConsumerGroupHandler, ConsumerHandler } from '../interfaces/internal.interface';

export type SubscribeInfoType = Map<string, ConsumerHandler>;
export const subscribeInfos: SubscribeInfoType = new Map();

export type SubscribeGroupInfoType = Map<string, ConsumerGroupHandler>;
export const subscribeGroupInfos: SubscribeGroupInfoType = new Map();
