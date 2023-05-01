import { prisma } from "./db.js";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { gql } from "graphql-tag";

// index.ts -> index.js
// db.ts -> db.js

(async function () {
  // .gql
  const typeDefs = gql`
    type Post {
      id: String
      title: String
      username: String
    }
    input EditPostInput {
      id: String!
      title: String
      username: String
    }
    type Query {
      getAllPosts: [Post]
      getPostById(id: String!): Post
    }

    type Mutation {
      createPost(title: String, username: String): Post
      deletePost(id: String): Boolean
      editPost(post: EditPostInput): Post
    }
  `;

  interface createPostInput {
    title: string;
    username: string;
  }

  interface EditPostInput {
    id: string;
    title?: string;
    username?: string;
  }

  const resolvers = {
    Mutation: {
      createPost: async (_parent: any, args: createPostInput) => {
        const post = await prisma.post.create({
          data: {
            title: args.title,
            username: args.username,
          },
        });
        return post;
      },

      deletePost: async (_parent: any, args: { id: string }) => {
        await prisma.post.delete({
          where: {
            id: args.id,
          },
        });

        return true;
      },

      editPost: async (_parent: any, args: { post: EditPostInput }) => {
        const { id, title, username } = args.post;
        const existingPost = await prisma.post.findUnique({ where: { id } });
        if (!existingPost) {
          throw new Error(`Post with id ${id} not found`);
        }
        const updatedPost = await prisma.post.update({
          where: { id },
          data: {
            title: title || existingPost.title,
            username: username || existingPost.username,
          },
        });
        return updatedPost;
      },
    },
    Query: {
      getAllPosts: async () => {
        return await prisma.post.findMany(); // Easy way to get a list of posts -> [post1, ....]
      },
      getPostById: async (_parent: any, args: { id: string }) => {
        const post = await prisma.post.findUnique({ where: { id: args.id } });

        if (!post) {
          throw new Error(`Post with id ${args.id} not found`);
        }

        return post;
      },
    },
  };

  // GraphQL Types vs Prisma Models
  // Post -> id, title, username
  // Prisma -> all the data being saved to your database

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log("Server is ready at " + url); // localhost:4000
})();
