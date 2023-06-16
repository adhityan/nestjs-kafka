import * as util from 'util';
import { Logger } from '@nestjs/common';
import { ProducerRecord } from '../interfaces/external.interface';

export class LogService {
    private readonly logger = new Logger('KafakaModule');

    warnSubcribeTopicTwice(container: Map<string, any>, topic: string) {
        if (container.has(topic)) this.logger.warn(`Listen twice of topic ${topic}`);
    }

    warnNotSubcribeAnyTopic() {
        this.logger.warn(`You did not subscribe to any topic, auto disconnect`);
    }

    warnContextHasNotBeenInstanced(name: string) {
        this.logger.warn(`Dependency ${name} has not been instantiated, auto instantiate it`);
    }

    errorParseBySchemaButSchemaRegistryNotfound(topic: string) {
        this.logger.error(`Subscribe to ${topic} and parse by schema but schema registry not found`);
    }

    errorSendMessageWithSchemaIdButSchemaRegistryNotFound(topic: string, schemaId: number) {
        this.logger.error(`Send message to ${topic} with schemaID: ${schemaId} but schema registry not found`);
    }

    subscribeToTopics(moduleName: string, topics: Iterable<string>) {
        for (const topic of topics) {
            this.logger.debug(`In context '${moduleName}', subscribe to topic ${topic}`);
        }
    }

    consumerListening(moduleName: string) {
        this.logger.debug(`Module ${moduleName} is ready. All listeners activated...`);
    }

    consumerDisconnected(moduleName: string) {
        this.logger.log(`Consumer for module ${moduleName} has disconnected successfully`);
    }

    producerConnected() {
        this.logger.log('Producer is connected');
    }

    producerDisconnected() {
        this.logger.log('Producer has disconnected successfully');
    }

    connectionsDisabledButSendReceived<T>(record: ProducerRecord<T>) {
        this.logger.log(`Kafka message send received but connections are disabled. Message topic '${record.topic}'`);
    }

    getKafkaJsLogger = (logLevel) => {
        return ({ namespace, level, label, log }) => {
            const logger = new Logger(`KafakaJS:${namespace}`);
            const { message, ...extra } = log;

            logger.log(
                util.inspect(
                    {
                        level,
                        label,
                        message,
                        extra,
                    },
                    { showHidden: false, depth: null, colors: true },
                ),
            );
        };
    };
}

export const logService = new LogService();
