import { useLazyLoadQuery, graphql, usePaginationFragment } from "react-relay";
import { ListGenerateTemplates_rootQuery } from "./__generated__/ListGenerateTemplates_rootQuery.graphql";
import { ListGenerateTemplates_generateTemplatesQuery } from "./__generated__/ListGenerateTemplates_generateTemplatesQuery.graphql";
import { ListGenerateTemplates_generateTemplates$key } from "./__generated__/ListGenerateTemplates_generateTemplates.graphql";
import { Button, List, Paper, Typography } from "@mui/material";
import GenerateTemplateListItem from "./GenerateTemplateListItem";
import { GenerateTemplate } from "../domains/GenerateTemplate";

type Props = {
  onClick?: (generateTemplate: GenerateTemplate) => void;
  onDelete?: (generateTemplateId: string) => void;
};

export default function ListGenerateTemplates({
  onClick,
  onDelete,
}: Props): JSX.Element {
  const count = 100;

  const data = useLazyLoadQuery<ListGenerateTemplates_rootQuery>(
    graphql`
      query ListGenerateTemplates_rootQuery($cursor: String, $count: Int!) {
        ...ListGenerateTemplates_generateTemplates
          @arguments(cursor: $cursor, count: $count)
      }
    `,
    {
      count,
    },
    { fetchPolicy: "store-and-network" }
  );

  const pagination = usePaginationFragment<
    ListGenerateTemplates_generateTemplatesQuery,
    ListGenerateTemplates_generateTemplates$key
  >(
    graphql`
      fragment ListGenerateTemplates_generateTemplates on Query
      @argumentDefinitions(cursor: { type: "String" }, count: { type: "Int!" })
      @refetchable(queryName: "ListGenerateTemplates_generateTemplatesQuery") {
        generateTemplates(after: $cursor, first: $count)
          @connection(key: "ListGenerateTemplates_generateTemplates") {
          edges {
            node {
              id
              ...GenerateTemplateListItem_generateTemplate
            }
          }
        }
      }
    `,
    data
  );

  return (
    <div>
      <Typography>テンプレート一覧</Typography>
      {pagination.data.generateTemplates.edges.length !== 0 ? (
        <List>
          {pagination.data.generateTemplates.edges
            .filter(
              (edge) =>
                // workaround for: https://github.com/facebook/relay/issues/3514
                edge.node
            )
            .map((edge) => (
              <GenerateTemplateListItem
                key={edge.node.id}
                generateTemplateKey={edge.node}
                onClick={onClick}
                onDelete={onDelete}
              />
            ))}
        </List>
      ) : (
        <>テンプレートがありません。</>
      )}

      {pagination.hasNext && (
        <Button
          onClick={() => pagination.loadNext(count)}
          variant="contained"
          disabled={pagination.isLoadingNext}
        >
          More
        </Button>
      )}
    </div>
  );
}
