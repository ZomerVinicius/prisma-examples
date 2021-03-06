import { useMutation, useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import Router from 'next/router'
import React, { useState } from 'react'
import { withApollo } from '../apollo/client'
import Layout from '../components/Layout'
import { DraftsQuery } from './drafts'

const CreateDraftMutation = gql`
    mutation CreateDraftMutation(
        $title: String!
        $content: String
        $authorEmail: String!
    ) {
        createDraft(
            title: $title
            content: $content
            authorEmail: $authorEmail
        ) {
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

export const AuthorsQuery = gql`
    query authorsQuery {
        authors {
            id
            name
            email
        }
    }
`

export interface IAuthor {
    id: number
    name: string
    email: string
}

export function Draft() {
    const { loading, error, data } = useQuery(AuthorsQuery)
    const [createDraft] = useMutation(CreateDraftMutation)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [authorEmail, setAuthorEmail] = useState(
        data?.authors.length > 0 ? data.authors[0].email : ''
    )

    if (loading) {
        return <div>Loading ...</div>
    }
    if (error) {
        return <div>Error: {error.message}</div>
    }

    return (
        <Layout>
            <div>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault()

                        await createDraft({
                            variables: {
                                title,
                                content,
                                authorEmail,
                            },
                            refetchQueries: [
                                {
                                    query: DraftsQuery,
                                },
                            ],
                        })
                        Router.push('/drafts')
                    }}
                >
                    <h1>Create Draft</h1>
                    <input
                        autoFocus
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        type="text"
                        value={title}
                    />
                    <select
                        onChange={(e) => setAuthorEmail(e.target.value)}
                        value={authorEmail}
                    >
                        {data?.authors.map((author: IAuthor) => (
                            <option value={author.email} key={author.id}>
                                {author.name}
                            </option>
                        ))}
                    </select>
                    <textarea
                        cols={50}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Content"
                        rows={8}
                        value={content}
                    />
                    <input
                        disabled={!content || !title || !authorEmail}
                        type="submit"
                        value="Create"
                    />
                    <a
                        className="back"
                        href="#"
                        onClick={() => Router.push('/')}
                    >
                        or Cancel
                    </a>
                </form>
            </div>
            <style jsx>{`
                .page {
                    background: white;
                    padding: 3rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                input[type='text'],
                textarea {
                    width: 100%;
                    padding: 0.5rem;
                    margin: 0.5rem 0;
                    border-radius: 0.25rem;
                    border: 0.125rem solid rgba(0, 0, 0, 0.2);
                }

                input[type='submit'] {
                    background: #ececec;
                    border: 0;
                    padding: 1rem 2rem;
                }

                .back {
                    margin-left: 1rem;
                }
            `}</style>
        </Layout>
    )
}

export default withApollo(Draft)
