import {
    asNexusMethod,
    intArg,
    makeSchema,
    objectType,
    stringArg,
} from '@nexus/schema'
import { PrismaClient } from '@prisma/client'
import { graphql } from 'graphql'
import { GraphQLDate } from 'graphql-iso-date'
import path from 'path'

export const GQLDate = asNexusMethod(GraphQLDate, 'date')

const prisma = new PrismaClient()

const User = objectType({
    name: 'User',
    definition(t) {
        t.int('id')
        t.string('name')
        t.string('email')
        t.field('profiles', {
            type: 'Profile',
            resolve: (parent) =>
                prisma.user
                    .findOne({
                        where: { id: Number(parent.id) },
                    })
                    .Profile(),
        })
        t.list.field('posts', {
            type: 'Post',
            resolve: (parent) =>
                prisma.user
                    .findOne({
                        where: { id: Number(parent.id) },
                    })
                    .Post(),
        })
    },
})

const Post = objectType({
    name: 'Post',
    definition(t) {
        t.int('id')
        t.string('title')
        t.string('content', {
            nullable: true,
        })
        t.boolean('published')
        t.field('author', {
            type: 'User',
            nullable: true,
            resolve: (parent) =>
                prisma.post
                    .findOne({
                        where: { id: Number(parent.id) },
                    })
                    .User(),
        })
    },
})

const Profile = objectType({
    name: 'Profile',
    definition(t) {
        t.int('id')
        t.string('bio')
        t.field('user', {
            type: 'User',
            nullable: false,
            resolve: (parent) =>
                prisma.profile
                    .findOne({
                        where: { id: Number(parent.id) },
                    })
                    .User(),
        })
    },
})

const Query = objectType({
    name: 'Query',
    definition(t) {
        t.field('post', {
            type: 'Post',
            args: {
                postId: stringArg({ nullable: false }),
            },
            resolve: (_, args) => {
                return prisma.post.findOne({
                    where: { id: Number(args.postId) },
                })
            },
        })
        t.field('profileByUserId', {
            type: 'Profile',
            args: {
                userId: stringArg({ nullable: false }),
            },
            resolve: (_, args) => {
                return prisma.profile.findOne({
                    where: { user: Number(args.userId) },
                })
            },
        })

        t.list.field('feed', {
            type: 'Post',
            resolve: (_parent, _args, ctx) => {
                return prisma.post.findMany({
                    where: { published: true },
                })
            },
        })

        t.list.field('authors', {
            type: 'User',
            resolve: (_parent, _args, ctx) => {
                return prisma.user.findMany({})
            },
        })

        t.list.field('drafts', {
            type: 'Post',
            resolve: (_parent, _args, ctx) => {
                return prisma.post.findMany({
                    where: { published: false },
                })
            },
        })

        t.list.field('filterPosts', {
            type: 'Post',
            args: {
                searchString: stringArg({ nullable: true }),
            },
            resolve: (_, { searchString }, ctx) => {
                return prisma.post.findMany({
                    where: {
                        OR: [
                            { title: { contains: searchString } },
                            { content: { contains: searchString } },
                        ],
                    },
                })
            },
        })
    },
})

const Mutation = objectType({
    name: 'Mutation',
    definition(t) {
        t.field('signupUser', {
            type: 'User',
            args: {
                name: stringArg(),
                email: stringArg({ nullable: false }),
            },
            resolve: (_, { name, email }, ctx) => {
                return prisma.user.create({
                    data: {
                        name,
                        email,
                    },
                })
            },
        })

        t.field('upsertProfile', {
            type: 'Profile',
            args: {
                id: intArg({ nullable: false }),
                bio: stringArg({ nullable: false }),
            },
            resolve: (_, { id, bio }, ctx) => {
                return prisma.profile.upsert({
                    where: { user: id },
                    create: {
                        User: { connect: { id } },
                        bio,
                    },
                    update: {
                        User: { connect: { id } },
                        bio,
                    },
                })
            },
        })

        t.field('deletePost', {
            type: 'Post',
            nullable: true,
            args: {
                postId: stringArg(),
            },
            resolve: (_, { postId }, ctx) => {
                return prisma.post.delete({
                    where: { id: Number(postId) },
                })
            },
        })

        t.field('createDraft', {
            type: 'Post',
            args: {
                title: stringArg({ nullable: false }),
                content: stringArg(),
                authorEmail: stringArg(),
            },
            resolve: (_, { title, content, authorEmail }, ctx) => {
                return prisma.post.create({
                    data: {
                        title,
                        content,
                        published: false,
                        User: {
                            connect: { email: authorEmail },
                        },
                    },
                })
            },
        })

        t.field('publish', {
            type: 'Post',
            nullable: true,
            args: {
                postId: stringArg(),
            },
            resolve: (_, { postId }, ctx) => {
                return prisma.post.update({
                    where: { id: Number(postId) },
                    data: { published: true },
                })
            },
        })
    },
})

export const schema = makeSchema({
    types: [Query, Mutation, Post, User, Profile, GQLDate],
    outputs: {
        typegen: path.join(process.cwd(), 'pages', 'api', 'nexus-typegen.ts'),
        schema: path.join(process.cwd(), 'pages', 'api', 'schema.graphql'),
    },
})

interface IRequest {
    body: {
        query: string
        variables: object
    }
}
interface IResponse {
    end: any
}

export default async (req: IRequest, res: IResponse) => {
    const query = req.body.query
    const variables = req.body.variables
    const response = await graphql(schema, query, {}, {}, variables)
    return res.end(JSON.stringify(response))
}
