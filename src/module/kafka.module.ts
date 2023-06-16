import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { DynamicModule, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Kafka } from 'kafkajs';

import { subscribeGroupInfos } from '../data';
import { logService } from '../services/log.service';
import { KafkaConsumer } from '../services/consumer.service';
import { KafkaProducer } from '../services/producer.service';
import { KafkaModuleAsyncConfig, KafkaModuleConfig } from '../interfaces/external.interface';

@Module({})
export class KafkaModule {
    static async forRoot({
        kafkaConfig,
        producerConfig,
        schemaRegistryConfig,
        disableConnections,
    }: KafkaModuleConfig): Promise<DynamicModule> {
        kafkaConfig.logCreator = logService.getKafkaJsLogger;
        const kafka = new Kafka(kafkaConfig);

        const producer = kafka.producer(producerConfig);
        let registry: SchemaRegistry | undefined = undefined;

        if (schemaRegistryConfig) {
            registry = new SchemaRegistry(schemaRegistryConfig);
        }

        return {
            global: true,
            module: KafkaModule,
            providers: [
                {
                    provide: KafkaConsumer,
                    inject: [ModuleRef],
                    useFactory: (moduleRef: ModuleRef) => {
                        return new KafkaConsumer(moduleRef, kafka, registry, subscribeGroupInfos, disableConnections);
                    },
                },
                {
                    provide: KafkaProducer,
                    useFactory: () => {
                        return new KafkaProducer(producer, registry, disableConnections);
                    },
                },
            ],
            exports: [KafkaProducer],
        };
    }

    static async forRootAsync(asyncConfig: KafkaModuleAsyncConfig): Promise<DynamicModule> {
        return {
            global: true,
            module: KafkaModule,
            imports: asyncConfig.imports,
            providers: [
                {
                    provide: KafkaConsumer,
                    inject: [ModuleRef, ...asyncConfig.inject],
                    useFactory: async (moduleRef: ModuleRef, ...args) => {
                        const { kafkaConfig, schemaRegistryConfig, disableConnections } = await asyncConfig.useFactory(
                            ...args,
                        );

                        let registry: SchemaRegistry | undefined = undefined;
                        kafkaConfig.logCreator = logService.getKafkaJsLogger;
                        const kafka = new Kafka(kafkaConfig);

                        if (schemaRegistryConfig) {
                            registry = new SchemaRegistry(schemaRegistryConfig);
                        }

                        return new KafkaConsumer(moduleRef, kafka, registry, subscribeGroupInfos, disableConnections);
                    },
                },
                {
                    provide: KafkaProducer,
                    inject: [...asyncConfig.inject],
                    useFactory: async (...args) => {
                        const { kafkaConfig, producerConfig, schemaRegistryConfig, disableConnections } =
                            await asyncConfig.useFactory(...args);

                        kafkaConfig.logCreator = logService.getKafkaJsLogger;
                        const kafka = new Kafka(kafkaConfig);

                        const producer = kafka.producer(producerConfig);
                        let registry: SchemaRegistry | undefined = undefined;

                        if (schemaRegistryConfig) {
                            registry = new SchemaRegistry(schemaRegistryConfig);
                        }

                        return new KafkaProducer(producer, registry, disableConnections);
                    },
                },
            ],
            exports: [KafkaProducer],
        };
    }
}
