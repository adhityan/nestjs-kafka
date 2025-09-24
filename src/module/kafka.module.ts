import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { DynamicModule, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Kafka } from 'kafkajs';
import { subscribeInfos } from '../data';
import { KafkaModuleAsyncConfig, KafkaModuleConfig } from '../interfaces/external.interface';
import { KafkaConsumer } from '../services/consumer.service';
import { KafkaProducer } from '../services/producer.service';

@Module({})
export class KafkaModule {
    static async forRoot({
        kafkaConfig,
        consumerConfig,
        producerConfig,
        schemaRegistryConfig,
        shouldReadFromBeginning = true,
        shouldRunConsumerAsync = false,
        mockConnections = false,
        kafkaPrefix = undefined,
    }: KafkaModuleConfig): Promise<DynamicModule> {
        if (kafkaPrefix) {
            consumerConfig.groupId = `${kafkaPrefix}${consumerConfig.groupId}`;
        }
        const kafka = new Kafka(kafkaConfig);
        const consumer = kafka.consumer(consumerConfig);
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
                        return new KafkaConsumer({
                            consumer,
                            subscribeInfos,
                            moduleRef,
                            registry,
                            shouldReadFromBeginning,
                            shouldRunConsumerAsync,
                            mockConnections,
                            kafkaPrefix,
                        });
                    },
                },
                {
                    provide: KafkaProducer,
                    useFactory: () => {
                        return new KafkaProducer(producer, mockConnections, registry, kafkaPrefix);
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
                        let {
                            consumerConfig,
                            kafkaConfig,
                            schemaRegistryConfig,
                            mockConnections,
                            kafkaPrefix,
                            shouldReadFromBeginning,
                            shouldRunConsumerAsync,
                        } = await asyncConfig.useFactory(...args);

                        if (shouldReadFromBeginning === undefined) {
                            shouldReadFromBeginning = true;
                        }

                        mockConnections = !!mockConnections;
                        shouldRunConsumerAsync = !!shouldRunConsumerAsync;

                        if (kafkaPrefix) {
                            consumerConfig.groupId = `${kafkaPrefix}${consumerConfig.groupId}`;
                        }

                        const kafka = new Kafka(kafkaConfig);
                        const consumer = kafka.consumer(consumerConfig);
                        let registry: SchemaRegistry | undefined = undefined;

                        if (schemaRegistryConfig) {
                            registry = new SchemaRegistry(schemaRegistryConfig);
                        }

                        return new KafkaConsumer({
                            consumer,
                            subscribeInfos,
                            moduleRef,
                            registry,
                            shouldReadFromBeginning,
                            shouldRunConsumerAsync,
                            mockConnections,
                            kafkaPrefix,
                        });
                    },
                },
                {
                    provide: KafkaProducer,
                    inject: [...asyncConfig.inject],
                    useFactory: async (...args) => {
                        let { kafkaConfig, producerConfig, schemaRegistryConfig, mockConnections, kafkaPrefix } =
                            await asyncConfig.useFactory(...args);

                        mockConnections = !!mockConnections;
                        const kafka = new Kafka(kafkaConfig);
                        const producer = kafka.producer(producerConfig);
                        let registry: SchemaRegistry | undefined = undefined;

                        if (schemaRegistryConfig) {
                            registry = new SchemaRegistry(schemaRegistryConfig);
                        }

                        return new KafkaProducer(producer, mockConnections, registry, kafkaPrefix);
                    },
                },
            ],
        };
    }
}
