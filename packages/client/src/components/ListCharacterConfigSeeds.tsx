import { useLazyLoadQuery, graphql, usePaginationFragment } from "react-relay";
import { ListCharacterConfigSeeds_rootQuery } from "./__generated__/ListCharacterConfigSeeds_rootQuery.graphql";
import { ListCharacterConfigSeeds_characterConfigSeedsQuery } from "./__generated__/ListCharacterConfigSeeds_characterConfigSeedsQuery.graphql";
import { ListCharacterConfigSeeds_characterConfigSeeds$key } from "./__generated__/ListCharacterConfigSeeds_characterConfigSeeds.graphql";
import { Button, List, Paper } from "@mui/material";
import CharacterConfigSeedListItem from "./CharacterConfigSeedListItem";

export default function ListCharacterConfigSeeds(): JSX.Element {
  const count = 100;

  const data = useLazyLoadQuery<ListCharacterConfigSeeds_rootQuery>(
    graphql`
      query ListCharacterConfigSeeds_rootQuery($cursor: String, $count: Int!) {
        ...ListCharacterConfigSeeds_characterConfigSeeds
          @arguments(cursor: $cursor, count: $count)
      }
    `,
    {
      count,
    },
    { fetchPolicy: "store-and-network" }
  );

  const pagination = usePaginationFragment<
    ListCharacterConfigSeeds_characterConfigSeedsQuery,
    ListCharacterConfigSeeds_characterConfigSeeds$key
  >(
    graphql`
      fragment ListCharacterConfigSeeds_characterConfigSeeds on Query
      @argumentDefinitions(cursor: { type: "String" }, count: { type: "Int!" })
      @refetchable(
        queryName: "ListCharacterConfigSeeds_characterConfigSeedsQuery"
      ) {
        characterConfigSeeds(
          after: $cursor
          first: $count
          includeExistCharacterConfig: false
        ) @connection(key: "ListCharacterConfigSeeds_characterConfigSeeds") {
          edges {
            node {
              id
              ...CharacterConfigSeedListItem_characterConfigSeed
            }
          }
        }
      }
    `,
    data
  );

  return (
    <div>
      {pagination.data.characterConfigSeeds.edges.length !== 0 ? (
        <List>
          {pagination.data.characterConfigSeeds.edges.map((edge) => (
            <CharacterConfigSeedListItem
              key={edge.node.id}
              characterConfigSeedKey={edge.node}
            />
          ))}
        </List>
      ) : (
        <Paper>登録できる他人の文字設定がありません</Paper>
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
