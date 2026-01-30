import * as _tanstack_query_db_collection0 from "@tanstack/query-db-collection";
import { Collection, InferSchemaOutput } from "@tanstack/react-db";
import * as _tanstack_db0 from "@tanstack/db";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/query-core";

//#region src/db.d.ts
type GenericPostgrestFilterBuilder = PostgrestFilterBuilder<any, any, any, any, any, any, any>;
interface SupabaseCollectionOptions<TSchema extends StandardSchemaV1, TKey extends string | number> {
  /** The name of the table in the database */
  tableName: string;
  /** The function to extract the key from the item, used for storing the item in the collection */
  getKey: (item: InferSchemaOutput<TSchema>) => TKey;
  /** The function to build the where clause for the postgrest-js query, used for update and delete operations */
  where: (query: GenericPostgrestFilterBuilder, item: InferSchemaOutput<TSchema>) => GenericPostgrestFilterBuilder;
  /** The schema of the collection */
  schema: TSchema;
  /** The query client */
  queryClient: QueryClient;
  /** The supabase client */
  supabase: SupabaseClient;
}
declare const createSupabaseCollection: <TSchema extends StandardSchemaV1, TKey extends string | number>({
  tableName,
  getKey,
  where,
  schema,
  queryClient,
  supabase
}: SupabaseCollectionOptions<TSchema, TKey>) => Collection<InferSchemaOutput<TSchema> | InferSchemaOutput<undefined & TSchema>, TKey, _tanstack_query_db_collection0.QueryCollectionUtils<TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferOutput<TSchema> extends object ? StandardSchemaV1.InferOutput<TSchema> : Record<string, unknown> : Record<string, unknown>, TKey, TSchema extends StandardSchemaV1<unknown, unknown> ? StandardSchemaV1.InferInput<TSchema> extends object ? StandardSchemaV1.InferInput<TSchema> : Record<string, unknown> : Record<string, unknown>, unknown>, TSchema | (undefined & TSchema), _tanstack_db0.InferSchemaInput<TSchema> | _tanstack_db0.InferSchemaInput<undefined & TSchema>> & _tanstack_db0.NonSingleResult;
//#endregion
export { createSupabaseCollection };