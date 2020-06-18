import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import Link from 'next/link'
import { withApollo } from '../apollo/client'
import Layout from '../components/Layout'
import { IAuthor } from './create'

export const FeedQuery = gql`
    query FeedQuery {
        feed {
            id
            title
            content
            published
            author {
                id
                name
            }
        }
    }
`

export interface IPost {
    id: number
    title: string
    content?: string
    published: boolean
    author: IAuthor
}

interface Props {
    post: IPost
}

const Post: React.FC<Props> = ({ post }) => {
    const authorName = post.author ? post.author.name : 'Unknown author'

    return (
        <Link href="/p/[id]" as={`/p/${post.id}`}>
            <a>
                <h2>{post.title}</h2>
                <small>By {authorName}</small>
                <p>{post.content}</p>
                <style jsx>{`
                    a {
                        text-decoration: none;
                        color: inherit;
                        padding: 2rem;
                        display: block;
                    }
                `}</style>
            </a>
        </Link>
    )
}

const Blog = () => {
    const { loading, error, data } = useQuery(FeedQuery)

    if (loading) {
        return <div>Loading ...</div>
    }
    if (error) {
        return <div>Error: {error.message}</div>
    }
    console.log('test')

    return (
        <Layout>
            <div className="page">
                <h1>My Blog</h1>
                <main>
                    {data.feed.map((post: IPost) => (
                        <div className="post" key={post.id}>
                            <Post key={post.id} post={post} />
                        </div>
                    ))}
                </main>
            </div>
            <style jsx>{`
                .post {
                    background: white;
                    transition: box-shadow 0.1s ease-in;
                }

                .post:hover {
                    box-shadow: 1px 1px 3px #aaa;
                }

                .post + .post {
                    margin-top: 2rem;
                }
            `}</style>
        </Layout>
    )
}

export default withApollo(Blog)
