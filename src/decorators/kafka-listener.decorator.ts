import { ConsumerConfig } from 'kafkajs';
import { SubscribeMetadataKey } from '../enums/subcribe-metadata-key.enum';
import { ConsumerGroupHandler, SubscribeHandler } from '../interfaces/internal.interface';
import { logService } from '../services/log.service';
import { subscribeGroupInfos } from '../data';

export function KafkaListener(consumerOptions: ConsumerConfig) {
    return (constructor: Function) => {
        const target = constructor.prototype;

        for (const key of Object.getOwnPropertyNames(target)) {
            const subscribeHandler: SubscribeHandler | undefined = Reflect.getMetadata(
                SubscribeMetadataKey.SUBSCRIBE_HANDLER,
                target,
                key,
            );

            if (!subscribeHandler) continue;

            const { topic, autoParseByJson: parseByJson, autoParseBySchema: parseBySchema } = subscribeHandler;

            const subscriptionGroup: ConsumerGroupHandler = subscribeGroupInfos.get(constructor.name) || {
                context: constructor,
                topics: new Map(),
                consumerOptions,
            };

            logService.warnSubcribeTopicTwice(subscriptionGroup.topics, topic);
            subscriptionGroup.topics.set(topic, {
                handler: target[key],
                autoParseByJson: parseByJson,
                autoParseBySchema: parseBySchema,
            });

            subscribeGroupInfos.set(constructor.name, subscriptionGroup);
        }
    };
}
