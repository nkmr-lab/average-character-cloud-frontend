import { graphql, useLazyLoadQuery, usePaginationFragment } from "react-relay";
import { Link } from "react-router-dom";
import { ListCharacterConfigs_rootQuery } from "./__generated__/ListCharacterConfigs_rootQuery.graphql";
import { ListCharacterConfigs_characterConfigs$key } from "./__generated__/ListCharacterConfigs_characterConfigs.graphql";
import { ListCharacterConfigs_characterConfigsQuery } from "./__generated__/ListCharacterConfigs_characterConfigsQuery.graphql";
import {
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import * as utf8 from "../utils/utf8";

export default function ListCharacterConfigConfigs(): JSX.Element {
  const count = 100;

  const data = useLazyLoadQuery<ListCharacterConfigs_rootQuery>(
    graphql`
      query ListCharacterConfigs_rootQuery($cursor: String, $count: Int!) {
        ...ListCharacterConfigs_characterConfigs
          @arguments(cursor: $cursor, count: $count)
      }
    `,
    {
      count,
    },
    { fetchPolicy: "store-and-network" }
  );

  const pagination = usePaginationFragment<
    ListCharacterConfigs_characterConfigsQuery,
    ListCharacterConfigs_characterConfigs$key
  >(
    graphql`
      fragment ListCharacterConfigs_characterConfigs on Query
      @argumentDefinitions(cursor: { type: "String" }, count: { type: "Int!" })
      @refetchable(queryName: "ListCharacterConfigs_characterConfigsQuery") {
        characterConfigs(after: $cursor, first: $count)
          @connection(key: "ListCharacterConfigs_characterConfigs") {
          edges {
            node {
              character {
                value
                figureRecords(userType: MYSELF, first: 1) {
                  edges {
                    __typename
                  }
                }
              }
              strokeCount
            }
          }
        }
      }
    `,
    data
  );

  return (
    <div>
      <Typography variant="h6">文字設定一覧</Typography>
      <Button
        component={Link}
        to={`/character-configs/create`}
        variant="contained"
      >
        文字設定を新規作成
      </Button>
      {pagination.data.characterConfigs.edges.length !== 0 ? (
        <List sx={{ maxWidth: 240 }}>
          {pagination.data.characterConfigs.edges.map((edge) => (
            <ListItem
              key={edge.node.character.value}
              sx={{
                backgroundColor:
                  edge.node.character.figureRecords.edges.length === 0
                    ? "#ffcccc"
                    : undefined,
              }}
              divider={true}
            >
              <ListItemButton
                component={Link}
                to={`/characters/character/${encodeURIComponent(
                  utf8.toBase64(edge.node.character.value)
                )}/figure-records`}
              >
                <ListItemText sx={{ width: 50 }}>
                  {edge.node.character.value}
                </ListItemText>
                <ListItemText>({edge.node.strokeCount}画)</ListItemText>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Paper>文字設定が登録されていません</Paper>
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
