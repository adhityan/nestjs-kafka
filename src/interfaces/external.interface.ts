import {
    EachMessagePayload as KafkaEachMessagePayload,
    KafkaMessage as KafkaConsumerMessage,
    ProducerRecord as KafkaProducerRecord,
    Message as KafkaProducerMessage,
    KafkaConfig,
    ProducerConfig,
} from 'kafkajs';
import { SchemaRegistryAPIClientArgs } from '@kafkajs/confluent-schema-registry/dist/api';
import { FactoryProvider, ModuleMetadata } from '@nestjs/common';

export interface KafkaModuleConfig {
    kafkaConfig: KafkaConfig;
    producerConfig?: ProducerConfig;
    schemaRegistryConfig?: SchemaRegistryAPIClientArgs;
    disableConnections?: boolean;
    kafkaPrefix?: string;
}

export type KafkaModuleAsyncConfig = Pick<ModuleMetadata, 'imports'> &
    Pick<FactoryProvider<KafkaModuleConfig>, 'useFactory' | 'inject'>;

export interface ProducerOption {
    /**
     * Default true
     */
    autoStringifyJson?: boolean;

    /**
     * If set to true, will use schema instead of json
     */
    schemaId?: number;
}

export interface ConsumerOption {
    /**
     * Default true
     */
    autoParseByJson?: boolean;

    /**
     * Default false
     * If set to true, will use schema instead of json
     */
    autoParseBySchema?: boolean;
}

type ConsumerMessage<T> = Omit<KafkaConsumerMessage, 'value'> & {
    value: T;
};

export interface EachMessagePayload<T> extends Omit<KafkaEachMessagePayload, 'message'> {
    message: ConsumerMessage<T>;
}

type ProducerMessage<T> = Omit<KafkaProducerMessage, 'value'> & {
    value: T;
};
export interface ProducerRecord<T> extends Omit<KafkaProducerRecord, 'messages'> {
    messages: ProducerMessage<T>[];
}
