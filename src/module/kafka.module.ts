import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { DynamicModule, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Kafka } from 'kafkajs';

import { subscribeGroupInfos, subscribeInfos } from '../data';
import { KafkaConsumer } from '../services/consumer.service';
import { KafkaProducer } from '../services/producer.service';
import { KafkaModuleAsyncConfig, KafkaModuleConfig } from '../interfaces/external.interface';

@Module({})
export class KafkaModule {
    static async forRoot({
        kafkaConfig,
        producerConfig,
        schemaRegistryConfig,
    }: KafkaModuleConfig): Promise<DynamicModule> {
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
                        return new KafkaConsumer(kafka, moduleRef, registry, subscribeGroupInfos);
                    },
                },
                {
                    provide: KafkaProducer,
                    useFactory: () => {
                        return new KafkaProducer(producer, registry);
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
                    useFactory: async (moduleRef: ModuleRef) => {
                        const { kafkaConfig, schemaRegistryConfig } = await asyncConfig.useFactory();

                        const kafka = new Kafka(kafkaConfig);
                        let registry: SchemaRegistry | undefined = undefined;

                        if (schemaRegistryConfig) {
                            registry = new SchemaRegistry(schemaRegistryConfig);
                        }

                        return new KafkaConsumer(kafka, moduleRef, registry, subscribeGroupInfos);
                    },
                },
                {
                    provide: KafkaProducer,
                    useFactory: async () => {
                        const { kafkaConfig, producerConfig, schemaRegistryConfig } = await asyncConfig.useFactory();

                        const kafka = new Kafka(kafkaConfig);
                        const producer = kafka.producer(producerConfig);
                        let registry: SchemaRegistry | undefined = undefined;

                        if (schemaRegistryConfig) {
                            registry = new SchemaRegistry(schemaRegistryConfig);
                        }

                        return new KafkaProducer(producer, registry);
                    },
                },
            ],
            exports: [KafkaProducer],
        };
    }
}
