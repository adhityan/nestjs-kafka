import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ModuleRef } from '@nestjs/core';

import { SubscribeGroupInfoType } from '../data';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { ConsumerHandler } from '../interfaces/internal.interface';
import { logService } from './log.service';

export class KafkaConsumer implements OnModuleDestroy, OnModuleInit {
    private readonly subscriptionMap: Map<string, Consumer>;

    constructor(
        private readonly kafka: Kafka,
        private readonly moduleRef: ModuleRef,
        private readonly registry: SchemaRegistry | undefined,
        private readonly subscribeGroupInfos: SubscribeGroupInfoType,
    ) {
        this.subscriptionMap = new Map<string, Consumer>();
    }

    async onModuleInit() {
        if (!this.subscribeGroupInfos.size) {
            logService.warnNotSubcribeAnyTopic();
            return;
        }

        for await (const [moduleName, subscribeGroupInfo] of this.subscribeGroupInfos) {
            const consumer = this.kafka.consumer(subscribeGroupInfo.consumerOptions);
            const contextInstance = await this.getContextInstance(subscribeGroupInfo.context);

            await consumer.subscribe({
                topics: [...subscribeGroupInfo.topics.keys()],
                fromBeginning: subscribeGroupInfo.shouldReadFromBeginning,
            });

            await consumer.run({
                eachMessage: async (payload: EachMessagePayload) => {
                    const subscribeInfo = subscribeGroupInfo.topics.get(payload.topic) as ConsumerHandler;

                    if (payload.message.value) {
                        if (subscribeInfo.autoParseBySchema) {
                            if (!this.registry) {
                                logService.errorParseBySchemaButSchemaRegistryNotfound(payload.topic);
                            } else {
                                payload.message.value = await this.registry.decode(payload.message.value);
                            }
                        } else if (subscribeInfo.autoParseByJson) {
                            payload.message.value = await JSON.parse(payload.message.value.toString());
                        }
                    }

                    await subscribeInfo.handler.call(contextInstance, payload);
                },
            });

            logService.subscribeToTopics(subscribeGroupInfo.topics.keys());
            this.subscriptionMap.set(moduleName, consumer);
        }
    }

    async onModuleDestroy() {
        for await (const [moduleName, consumer] of this.subscriptionMap) {
            await consumer.disconnect();
            logService.consumerDisconnected(moduleName);
        }
    }

    private async getContextInstance(context: Function) {
        let instance = this.moduleRef.get(context, { strict: false });

        if (!instance) {
            instance = await this.moduleRef.create(instance);
            logService.warnContextHasNotBeenInstanced(context.name);
        }

        return instance;
    }
}
