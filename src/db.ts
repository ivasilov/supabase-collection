/* biome-ignore-all lint/suspicious/noExplicitAny: PostgrestFilterBuilder requires database schema types which are not available without codegen */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { type Collection } from "@tanstack/react-db";
import {
  subsetOptionsToQueryKey,
  supabaseOnDelete,
  supabaseOnInsert,
  supabaseOnUpdate,
  supabaseQueryFn,
} from "./functions";
import { getQueryClient } from "./query-client";

type GenericPostgrestFilterBuilder = PostgrestFilterBuilder<
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

interface SupabaseCollectionOptions<
  TSchema extends StandardSchemaV1,
  TKey extends string | number,
> {
  /** The name of the table in the database */
  tableName: string;
  /** The function to extract the key from the item, used for storing the item in the collection */
  getKey: (item: StandardSchemaV1.InferOutput<TSchema>) => TKey;
  /** The function to build the where clause for the postgrest-js query, used for update and delete operations */
  where: (
    query: GenericPostgrestFilterBuilder,
    item: StandardSchemaV1.InferOutput<TSchema>,
  ) => GenericPostgrestFilterBuilder;
  /** The schema of the collection */
  schema: TSchema;
  /** The query client */
  queryClient?: QueryClient;
  /** The supabase browser client */
  supabase: SupabaseClient;
  /** Whether to receive updates when a record has been inserted, updated, or deleted by another user */
  realtime?: boolean;
}

interface TableEntry {
  supabase: SupabaseClient;
  collectionRef: Collection<any, any> | null;
  realtimeChannel: ReturnType<SupabaseClient["channel"]> | null;
}

// Per-QueryClient registry of table entries, with a single cache subscription per client
const queryClientRegistries = new Map<QueryClient, Map<string, TableEntry>>();

const ensureQueryCacheSubscription = (queryClient: QueryClient) => {
  if (queryClientRegistries.has(queryClient)) return;

  const tables = new Map<string, TableEntry>();
  queryClientRegistries.set(queryClient, tables);

  queryClient.getQueryCache().subscribe((args) => {
    if (args.type !== "observerAdded" && args.type !== "observerRemoved") {
      return;
    }
    for (const [tableName, entry] of tables) {
      const queries = queryClient.getQueryCache().findAll({
        queryKey: [tableName],
        type: "active",
      });

      if (queries.length > 0 && !entry.realtimeChannel && entry.collectionRef) {
        entry.realtimeChannel = attachSupabaseListeners(
          entry.supabase,
          tableName,
          entry.collectionRef,
        );
      } else if (queries.length === 0 && entry.realtimeChannel) {
        entry.supabase.removeChannel(entry.realtimeChannel);
        entry.realtimeChannel = null;
      }
    }
  });
};

const registerTable = (
  queryClient: QueryClient,
  tableName: string,
  supabase: SupabaseClient,
): TableEntry => {
  ensureQueryCacheSubscription(queryClient);
  const tables = queryClientRegistries.get(queryClient)!;

  if (!tables.has(tableName)) {
    tables.set(tableName, {
      supabase,
      collectionRef: null,
      realtimeChannel: null,
    });
  }

  return tables.get(tableName)!;
};

export const supabaseCollectionOptions = <
  TSchema extends StandardSchemaV1,
  TKey extends string | number,
>({
  tableName,
  getKey,
  where,
  schema,
  queryClient,
  supabase,
  realtime,
}: SupabaseCollectionOptions<TSchema, TKey>) => {
  // if the query client is not provided, use the global query client
  queryClient = queryClient ?? getQueryClient();

  let entry: TableEntry | null = null;
  if (realtime) {
    entry = registerTable(queryClient, tableName, supabase);
  }
  const config = queryCollectionOptions({
    queryClient,
    getKey,
    schema,
    queryKey: (ctx) => subsetOptionsToQueryKey(tableName, ctx),
    syncMode: "on-demand",
    queryFn: (ctx) => supabaseQueryFn(supabase, tableName, ctx),
    onInsert: (ctx) => supabaseOnInsert(supabase, tableName, ctx),
    onUpdate: (ctx) => supabaseOnUpdate(supabase, tableName, where, ctx),
    onDelete: (ctx) => supabaseOnDelete(supabase, tableName, where, ctx),
  });

  const originalSync = config.sync.sync;

  return {
    ...config,
    sync: {
      sync: (
        ...args: Parameters<typeof originalSync>
      ): ReturnType<typeof originalSync> => {
        if (entry) {
          entry.collectionRef = args[0].collection as Collection<any, any>;
        }
        return originalSync(...args);
      },
    },
  };
};

const attachSupabaseListeners = <
  T extends object,
  TKey extends string | number,
>(
  supabase: SupabaseClient,
  tableName: string,
  collection: Collection<T, TKey>,
): ReturnType<SupabaseClient["channel"]> | null => {
  if (!supabase.channel) {
    console.log("Server supabase doesn't have a channel");
    return null;
  }

  const channel = supabase.channel(tableName);
  channel
    .on<T>(
      "postgres_changes",
      { event: "*", schema: "public", table: tableName },
      async (payload) => {
        if (payload.eventType === "INSERT") {
          collection.utils.writeInsert(payload.new);
        } else if (payload.eventType === "UPDATE") {
          collection.utils.writeUpdate(payload.new);
        } else if (payload.eventType === "DELETE") {
          const id = collection.getKeyFromItem(payload.old as T);
          if (collection.has(id)) {
            collection.utils.writeDelete(id);
          }
        }
      },
    )
    .subscribe();

  return channel;
};
