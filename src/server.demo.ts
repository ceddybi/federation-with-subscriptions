import { PubSub, withFilter } from "graphql-subscriptions";
import { createGateway, createMicroservice } from ".";

import { pubsub1 } from "./demo/redis1";
import { pubsub2 } from "./demo/redis2";

// const pubsub = new PubSub();

const usersMicroservice = () =>
  createMicroservice({
    label: "Users",
    port: 4001,
    typeDefs: `
        type User {
          id: ID!
          name: String!
        }
  
        type Query {
          users: [User!]!
        }
      `,
    resolvers: {
      Query: {
        users: () => [{ id: "1", name: "Sammy" }],
      },
    },
  });

const blogPostsMicroservice = () =>
  createMicroservice({
    label: "Blog Posts",
    port: 4002,
    context: ({ req }) => ({ headers: req.headers }),
    subscriptionContext: (ctx, message, args, headers) => ({ headers }),
    typeDefs: `
        type BlogPost {
          id: ID!
          title: String!
        }
  
        extend type User @key(fields: "id") {
          id: ID! @external
          blogPosts: [BlogPost!]!
        }
  
        type Mutation {
          updateBlogPost: BlogPost!
        }
              
        type Subscription {
          blogPostUpdates: BlogPost!
        }
      `,
    resolvers: {
      User: {
        blogPosts: () => [{ id: "44", title: "The Latest Post" }],
      },
      Mutation: {
        updateBlogPost: () => {
          const blogPost = {
            id: String(Math.random()),
            title: "A random post",
          };

          pubsub1.publish("BLOG_POST_UPDATED", {
            blogPostUpdates: blogPost,
          });

          return blogPost;
        },
      },
      Subscription: {
        blogPostUpdates: {
          subscribe: withFilter(
            () => pubsub2.asyncIterator(["BLOG_POST_UPDATED"]),
            (payload, variables, context) => {
              console.log({
                subscriptionContext: context,
              });

              return true;
            },
          ),
        },
      },
    },
  });

const main = async () => {
  const microservices = await Promise.all([
    usersMicroservice(),
    blogPostsMicroservice(),
    new Promise((resolve) => {
      resolve({
        endpoint: "localhost:3099/graphql",
        introspection: true,
      });
    }),
  ]);

  const { expressApp } = await createGateway({
    //   @ts-ignore
    microservices,
    port: 4000,

    // send some headers to subgraph microservices
    buildHttpHeaders: ({ req }) => ({
      "authorization": "Bearer secrettoken",
    }),
    buildSubscriptionHeaders: ({ connectionParams }) => ({
      "authorization": "Bearer secrettoken",
    }),
  });
};

main();
