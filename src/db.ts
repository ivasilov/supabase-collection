/* biome-ignore-all lint/suspicious/noExplicitAny: PostgrestFilterBuilder requires database schema types which are not available without codegen */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
	type Collection,
	createCollection,
	type InferSchemaOutput,
} from "@tanstack/react-db";
import {
	subsetOptionsToQueryKey,
	supabaseOnDelete,
	supabaseOnInsert,
	supabaseOnUpdate,
	supabaseQueryFn,
} from "./functions";

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
	getKey: (item: InferSchemaOutput<TSchema>) => TKey;
	/** The function to build the where clause for the postgrest-js query, used for update and delete operations */
	where: (
		query: GenericPostgrestFilterBuilder,
		item: InferSchemaOutput<TSchema>,
	) => GenericPostgrestFilterBuilder;
	/** The schema of the collection */
	schema: TSchema;
	/** The query client */
	queryClient: QueryClient;
	/** The supabase client */
	supabase: SupabaseClient;
}

const supabaseCollectionOptions = <
	TSchema extends StandardSchemaV1,
	TKey extends string | number,
>({
	tableName,
	getKey,
	where,
	schema,
	queryClient,
	supabase,
}: SupabaseCollectionOptions<TSchema, TKey>) => {
	return queryCollectionOptions({
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
};

const attachSupabaseListeners = <
	T extends object,
	TKey extends string | number,
>(
	supabase: SupabaseClient,
	tableName: string,
	collection: Collection<T, TKey>,
) => {
	supabase
		.channel(tableName)
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
};

export const createSupabaseCollection = <
	TSchema extends StandardSchemaV1,
	TKey extends string | number,
>({
	tableName,
	getKey,
	where,
	schema,
	queryClient,
	supabase,
}: SupabaseCollectionOptions<TSchema, TKey>) => {
	const collection = createCollection(
		supabaseCollectionOptions({
			tableName,
			getKey,
			where,
			schema,
			queryClient,
			supabase,
		}),
	);

	attachSupabaseListeners(supabase, tableName, collection);

	return collection;
};
