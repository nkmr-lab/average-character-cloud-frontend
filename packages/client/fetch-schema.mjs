import {
  getIntrospectionQuery,
  buildClientSchema,
  printSchema,
} from "graphql/utilities/index.mjs";
import * as fs from "fs/promises";
import axios from "axios";

const introspectionQuery = getIntrospectionQuery();
const schema = await new axios.post("http://localhost:8080/graphql", {
  query: introspectionQuery,
}).then((res) => res.data);
const gql = printSchema(buildClientSchema(schema.data));
await fs.writeFile("schema.graphql", gql);
