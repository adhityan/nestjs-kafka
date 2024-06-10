import { ConsumerConfig } from 'kafkajs';
import { ConsumerOption } from './external.interface';

export interface SubscribeHandler extends ConsumerOption {
    topic: string;
}

export interface ConsumerHandler extends ConsumerOption {
    handler: (...args: any[]) => any;
}

export interface ConsumerGroupHandler extends ConsumerOption {
    context: Function;
    consumerOptions: ConsumerConfig;
    topics: Map<string, ConsumerHandler>;
    shouldReadFromBeginning?: boolean;
}
