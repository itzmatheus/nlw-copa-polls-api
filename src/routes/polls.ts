import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"
import { z } from 'zod';
import ShortUniqueId from 'short-unique-id';

export async function pollRoutes(fastify: FastifyInstance) {

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

        try {
            await request.jwtVerify()
            await prisma.poll.create({
                data: {
                    title,
                    code,
                    ownerId: request.user.sub,

                    participants: {
                        create: {
                            userId: request.user.sub,
                        }
                    }
                }
            })
        } catch (error) {
            await prisma.poll.create({
                data: {
                    title,
                    code
                }
            })
        }


        return reply.status(201).send({ code })

    })

}