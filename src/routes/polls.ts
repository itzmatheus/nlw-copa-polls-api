import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"
import { z } from 'zod';
import ShortUniqueId from 'short-unique-id';
import { authenticate } from "../plugins/authenticate";

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

    fastify.post('/polls/join',
    { onRequest: [authenticate] },
    async (request, reply) => {

        const joinPollBody = z.object({
            code: z.string()
        })

        const { code } = joinPollBody.parse(request.body)

        const poll = await prisma.poll.findUnique({
            where: {
                code
            },
            include: {
                participants: {
                    where: {
                        userId: request.user.sub,
                    }
                }
            }
        })

        if (!poll) {
            reply.status(400).send({
                message: 'Poll not found.'
            })
        }

        if (poll && poll.participants.length > 0) {
            reply.status(400).send({
                message: 'You already joined this poll.'
            })
        }

        if (poll && !poll.ownerId) {
            await prisma.poll.update({
                where: {
                    id: poll.id,
                },
                data: {
                    ownerId: request.user.sub,
                }
            })
        }

       poll && await prisma.participant.create({
            data: {
                pollId: poll.id,
                userId: request.user.sub,
            }
        })

        return reply.status(201).send()
    })

    fastify.get('/polls', {
        onRequest: [authenticate],
    },
    async (request) => {
        const polls = await prisma.poll.findMany({
            where: {
                participants: {
                    some: {
                        userId: request.user.sub,
                    }
                }
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                participants: {
                    select: {
                        id: true,

                        user: {
                            select: {
                                avatarUrl: true,
                            }
                        }
                    },
                    take: 4,
                },
                _count: {
                    select: {
                        participants: true,
                    }
                }
            }
        })

        return { polls }
    })

    fastify.get('/polls/:id', {
        onRequest: [authenticate],
    },
    async (request) => {

        const getPollParams = z.object({
            id: z.string(),
        })

        const { id } = getPollParams.parse(request.params)

        const poll = await prisma.poll.findUnique({
            where: {
                id,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                participants: {
                    select: {
                        id: true,

                        user: {
                            select: {
                                avatarUrl: true,
                            }
                        }
                    },
                    take: 4,
                },
                _count: {
                    select: {
                        participants: true,
                    }
                }
            }
        })

        return { poll }
    })


}