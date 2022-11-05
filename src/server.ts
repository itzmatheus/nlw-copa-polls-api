import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import ShortUniqueId from 'short-unique-id'; 'short-unique-id';

const prisma = new PrismaClient({
    log: ['query'],
})

async function bootstrap() {
    const fastify = Fastify({
        logger: true,
    })

    await fastify.register(cors, {
        origin: true,
    })

    fastify.get('/users/count', async () => {
        const count = await prisma.user.count()
        return { count }
    })

    fastify.get('/guesses/count', async () => {
        const count = await prisma.guess.count()
        return { count }
    })

    fastify.get('/polls/count', async () => {
        const count = await prisma.poll.count()
        return { count }
    })

    fastify.post('/polls', async (request, reply) => {

        const createPollBody = z.object({
            title: z.string()
        })

        const { title } = createPollBody.parse(request.body);

        const generate = new ShortUniqueId({ length: 6 })
        const code = new String(generate()).toUpperCase()

        await prisma.poll.create({
            data: {
                title,
                code
            }
        })

        return reply.status(201).send({ code })

    })

    await fastify.listen({ port: 3333, host: '0.0.0.0' })
}

bootstrap();