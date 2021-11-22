import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['pkc-ewzgj.europe-west4.gcp.confluent.cloud:9092'],
          ssl: true,
          sasl: {
            mechanism: 'plain',
            username: 'TV46F6NSQWEHQMRP',
            password:
              'Et55gCxWABw2gcq/lW2Vi0fj/B5UW+5ctlGQtIYflhsZ3xtWyznN/K3XJmEcsfwy',
          },
        },
      },
    },
  );
  app.listen(()=> {
    console.log('Microservice is listening');
  });
}
bootstrap();
