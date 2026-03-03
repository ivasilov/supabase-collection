import * as _tanstack_query_db_collection0 from "@tanstack/query-db-collection";
import { Collection } from "@tanstack/react-db";
import { QueryClient } from "@tanstack/query-core";
import * as _tanstack_db0 from "@tanstack/db";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { SupabaseClient } from "@supabase/supabase-js";

//#region src/db.d.ts
type GenericPostgrestFilterBuilder = PostgrestFilterBuilder<any, any, any, any, any, any, any>;
interface SupabaseCollectionOptions<TSchema extends StandardSchemaV1, TKey extends string | number> {
  /** The name of the table in the database */
  tableName: string;
  /** The function to extract the key from the item, used for storing the item in the collection */
  getKey: (item: StandardSchemaV1.InferOutput<TSchema>) => TKey;
  /** The function to build the where clause for the postgrest-js query, used for update and delete operations */
  where: (query: GenericPostgrestFilterBuilder, item: StandardSchemaV1.InferOutput<TSchema>) => GenericPostgrestFilterBuilder;
  /** The schema of the collection */
  schema: TSchema;
  /** The query client */
  queryClient?: QueryClient;
  /** The supabase browser client */
  supabase: SupabaseClient;
  /** Whether to receive updates when a record has been inserted, updated, or deleted by another user */
  realtime?: boolean;
}
declare const supabaseCollectionOptions: <TSchema extends StandardSchemaV1, TKey extends string | number>({
  tableName,
  getKey,
  where,
  schema,
  queryClient,
  supabase,
  realtime
}: SupabaseCollectionOptions<TSchema, TKey>) => {
  sync: {
    sync: (params: {
      collection: Collection<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, any, any, any>;
      begin: (options?: {
        immediate?: boolean;
      }) => void;
      write: (message: _tanstack_db0.ChangeMessageOrDeleteKeyMessage<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey>) => void;
      commit: () => void;
      markReady: () => void;
      truncate: () => void;
    }) => ReturnType<(params: {
      collection: Collection<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, any, any, any>;
      begin: (options?: {
        immediate?: boolean;
      }) => void;
      write: (message: _tanstack_db0.ChangeMessageOrDeleteKeyMessage<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey>) => void;
      commit: () => void;
      markReady: () => void;
      truncate: () => void;
    }) => void | _tanstack_db0.CleanupFn | _tanstack_db0.SyncConfigRes>;
  };
  id?: string;
  schema: TSchema | (undefined & TSchema);
  getKey: (item: TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>) => TKey;
  gcTime?: number;
  startSync?: boolean;
  autoIndex?: `off` | `eager`;
  compare?: ((x: TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, y: TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>) => number) | undefined;
  syncMode?: _tanstack_db0.SyncMode;
  onInsert?: _tanstack_db0.InsertMutationFn<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, _tanstack_query_db_collection0.QueryCollectionUtils<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferInput<TSchema> extends object ? StandardSchemaV1.InferInput<TSchema> : Record<string, unknown> : Record<string, unknown>, unknown>, any> | undefined;
  onUpdate?: _tanstack_db0.UpdateMutationFn<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, _tanstack_query_db_collection0.QueryCollectionUtils<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferInput<TSchema> extends object ? StandardSchemaV1.InferInput<TSchema> : Record<string, unknown> : Record<string, unknown>, unknown>, any> | undefined;
  onDelete?: _tanstack_db0.DeleteMutationFn<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, _tanstack_query_db_collection0.QueryCollectionUtils<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferInput<TSchema> extends object ? StandardSchemaV1.InferInput<TSchema> : Record<string, unknown> : Record<string, unknown>, unknown>, any> | undefined;
  defaultStringCollation?: _tanstack_db0.StringCollationConfig;
  utils: _tanstack_query_db_collection0.QueryCollectionUtils<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferInput<TSchema> extends object ? StandardSchemaV1.InferInput<TSchema> : Record<string, unknown> : Record<string, unknown>, unknown>;
};
//#endregion
export { supabaseCollectionOptions };