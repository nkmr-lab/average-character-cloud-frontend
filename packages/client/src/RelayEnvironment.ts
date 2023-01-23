import { Environment, Network, RecordSource, Store } from "relay-runtime";

async function fetchGraphQL(text: string | null | undefined, variables: {}) {
  const response = await fetch("/backend/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: text,
      variables,
    }),
  });

  return await response.json();
}

export default new Environment({
  network: Network.create((params, variables) =>
    fetchGraphQL(params.text, variables)
  ),
  store: new Store(new RecordSource()),
});
