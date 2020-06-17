import { useLazyQuery, useMutation, useQuery } from "@apollo/react-hooks"
import gql from "graphql-tag"
import Router from "next/router"
import React, { useEffect, useState } from "react"
import { withApollo } from "../apollo/client"
import Layout from "../components/Layout"
import { AuthorsQuery } from "./create"

const CreateProfileMutation = gql`
  mutation CreateProfileMutation(
    $title: String!
    $bio: String
    $authorEmail: String!
  ) {
    createProfile(title: $title, bio: $bio, authorEmail: $authorEmail) {
      id
      title
      bio
      published
      author {
        id
        name
      }
    }
  }
`

const ProfileQuery = gql`
  query Profile($userId: String!) {
    profileByUserId(userId: $userId) {
      id
      bio
      user {
        id
        name
        email
      }
    }
  }
`

const UpsertProfileMutation = gql`
  mutation UpsertProfileMutation($id: Int!, $bio: String!) {
    upsertProfile(id: $id, bio: $bio) {
      id
      bio
    }
  }
`

function Profile(props) {
  const {
    loading: loadingAuthors,
    error: authorError,
    data: authorData,
  } = useQuery(AuthorsQuery)

  const [upsertProfile, { data: upsertProfileData }] = useMutation(
    UpsertProfileMutation
  )
  console.log(upsertProfileData)

  const [authorEmail, setAuthorEmail] = useState(
    authorData?.authors.length > 0 ? authorData.authors[0].email : ""
  )
  const [getProfileByUserId, { data: profileData }] = useLazyQuery(ProfileQuery)

  console.log(profileData)

  const findUserByEmail = authorData?.authors.find(
    (author) => author.email === authorEmail
  )
  useEffect(() => {
    if (authorEmail) {
      getProfileByUserId({
        variables: { userId: String(findUserByEmail?.id) },
      })
    }
  }, [authorEmail])

  useEffect(() => {
    setBio(profileData?.profileByUserId?.bio || "")
  }, [profileData])

  const [bio, setBio] = useState("")

  if (loadingAuthors) {
    return <div>Loading ...</div>
  }
  if (authorError) {
    return <div>Error: {authorError.message}</div>
  }

  return (
    <Layout>
      <div>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            await upsertProfile({
              variables: {
                id: findUserByEmail?.id,
                bio,
              },
            })
          }}
        >
          <h1>Update profile</h1>
          <select
            onChange={(e) => setAuthorEmail(e.target.value)}
            value={authorEmail}
          >
            {authorData?.authors.map((author) => (
              <option value={author.email}>{author.name}</option>
            ))}
          </select>
          <textarea
            cols={50}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
            rows={5}
            value={bio}
          />
          <input type="submit" value="Save" />
          <a className="back" href="#" onClick={() => Router.push("/")}>
            or Cancel
          </a>
        </form>
      </div>
      <style jsx>{`
        .page {
          background: white;
          padding: 3rem;
          display: flex;
          justify-bio: center;
          align-items: center;
        }

        input[type="text"],
        textarea {
          width: 100%;
          padding: 0.5rem;
          margin: 0.5rem 0;
          border-radius: 0.25rem;
          border: 0.125rem solid rgba(0, 0, 0, 0.2);
        }

        input[type="submit"] {
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

export default withApollo(Profile)
