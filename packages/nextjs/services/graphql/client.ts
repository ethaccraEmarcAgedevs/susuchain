import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from "@apollo/client";

// Base subgraph endpoint (will be replaced with actual deployed endpoint)
const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL || "https://api.studio.thegraph.com/query/susuchain-base/v1";

// Create Apollo Client for subgraph queries
export const subgraphClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link: new HttpLink({
    uri: SUBGRAPH_URL,
    fetch,
  }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          groups: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          members: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "ignore",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
  },
});

// Helper function to handle GraphQL errors
export function handleGraphQLError(error: any): string {
  if (error?.networkError) {
    return "Network error: Unable to connect to subgraph";
  }
  if (error?.graphQLErrors?.length > 0) {
    return error.graphQLErrors[0].message;
  }
  return "An unknown error occurred";
}
