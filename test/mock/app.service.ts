import { Inject, Injectable } from '@nestjs/common';
import { EachMessagePayload, KafkaListener, SubscribeTo } from '../../src';
import { KafkaProducer } from '../../src/services/producer.service';
import { testMockFn, Topic } from './config';

@Injectable()
@KafkaListener({ groupId: 'group-id' })
export class AppService {
    constructor(
        private kafkaProducer: KafkaProducer,
        @Inject('TEST_CONSUMER') private testConsumer1Fn: Function,
        @Inject('TEST_PRODUCER1') private testProducer1Fn: Function,
    ) {}

    @SubscribeTo(Topic, { autoParseByJson: true })
    async test(payload: EachMessagePayload<string>) {
        console.log('value', payload.message.value);
        console.log('header', payload.message.headers);
        console.log('key', payload.message.key);
        this.testConsumer1Fn();
    }

    async sendMessage() {
        await this.kafkaProducer.send(
            {
                topic: Topic,
                messages: [{ value: { as: 'as' } }],
            },
            {
                autoStringifyJson: true,
            },
        );
        this.testProducer1Fn();
    }
}
