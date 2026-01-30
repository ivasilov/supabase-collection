import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection, extractSimpleComparisons, parseLoadSubsetOptions, parseOrderByExpression, parseWhereExpression } from "@tanstack/react-db";

//#region src/functions.ts
const buildQuery = (baseQuery, filter) => {
	if (filter.operator === "eq") baseQuery = baseQuery.eq(filter.field?.join("."), filter.value);
	else if (filter.operator === "gt") baseQuery = baseQuery.gt(filter.field?.join("."), filter.value);
	else if (filter.operator === "gte") baseQuery = baseQuery.gte(filter.field?.join("."), filter.value);
	else if (filter.operator === "lt") baseQuery = baseQuery.lt(filter.field.join("."), filter.value);
	else if (filter.operator === "lte") baseQuery = baseQuery.lte(filter.field.join("."), filter.value);
	else if (filter.operator === "in") baseQuery = baseQuery.in(filter.field.join("."), filter.value);
	else if (filter.operator === "isNull") baseQuery = baseQuery.is(filter.field.join("."), null);
	else if (filter.operator === "not_eq") baseQuery = baseQuery.not(filter.field?.join("."), "eq", filter.value);
	else console.warn(`buildQuery: unsupported operator: ${filter.operator}`);
};
const subsetOptionsToQueryKey = (tableName, ctx) => {
	const filters = parseWhereExpression(ctx.where, {
		handlers: {
			eq: (field, value) => {
				return `${field.join(".")}=eq.${value}`;
			},
			or: (field, value) => {
				return `or(${field},${value})`;
			},
			isNull: (field) => `${field.join(".")}=is.null`,
			in: (field, value) => {
				const uniqueValues = Array.from(new Set(value));
				return `${field.join(".")}=in.${uniqueValues}`;
			},
			and: (...filters$1) => {
				return `${filters$1.map((filter) => filter).join("&")}`;
			}
		},
		onUnknownOperator: (operator, args) => {
			console.warn(`Unsupported operator: ${operator}`);
			return null;
		}
	}) || [];
	const sorts = parseOrderByExpression(ctx.orderBy);
	const limit = ctx.limit;
	return [
		tableName,
		filters,
		sorts.map((sort) => `${sort.field.join(".")}:${sort.direction}`),
		limit
	];
};
const supabaseQueryFn = async (supabase, tableName, ctx) => {
	const { limit, orderBy, offset, where, cursor } = ctx.meta?.loadSubsetOptions || {};
	let cursorFilters = [];
	if (cursor) cursorFilters = [...extractSimpleComparisons(cursor.whereFrom)];
	const parsed = parseLoadSubsetOptions({
		orderBy,
		limit,
		where
	});
	let baseQuery = supabase.from(tableName).select("*");
	if (parsed.limit) baseQuery = baseQuery.limit(parsed.limit);
	if (offset) baseQuery = baseQuery.range(offset, offset + 5);
	if (parsed.sorts) parsed.sorts.forEach((sort) => {
		baseQuery = baseQuery.order(sort.field.join("."), { ascending: sort.direction === "asc" });
	});
	if (parsed.filters) [...parsed.filters, ...cursorFilters].forEach((filter) => {
		buildQuery(baseQuery, filter);
	});
	const { data, error } = await baseQuery;
	if (error) throw error;
	return data || [];
};
const supabaseOnInsert = async (supabase, tableName, { transaction, collection }) => {
	await Promise.all(transaction.mutations.map(async (mutation) => {
		const { data, error } = await supabase.from(tableName).insert({ ...mutation.modified }).select().single();
		if (error) throw error;
		mutation.modified = data;
		collection.utils.writeInsert(data);
	}));
	return { refetch: false };
};
const supabaseOnUpdate = async (supabase, tableName, filter, { transaction, collection }) => {
	await Promise.all(transaction.mutations.map(async (mutation) => {
		const { original, changes } = mutation;
		const { error, data } = await filter(supabase.from(tableName).update({
			...original,
			...changes
		}), mutation.original).select().single();
		if (error) throw error;
		mutation.modified = data;
		collection.utils.writeUpdate(data);
	}));
	return { refetch: false };
};
const supabaseOnDelete = async (supabase, tableName, filter, { transaction, collection }) => {
	await Promise.all(transaction.mutations.map(async (mutation) => {
		const { error } = await filter(supabase.from(tableName).delete(), mutation.original);
		if (error) throw error;
		collection.utils.writeDelete(collection.getKeyFromItem(mutation.original));
	}));
	return { refetch: false };
};

//#endregion
//#region src/db.ts
const supabaseCollectionOptions = ({ tableName, getKey, where, schema, queryClient, supabase }) => {
	return queryCollectionOptions({
		queryClient,
		getKey,
		schema,
		queryKey: (ctx) => subsetOptionsToQueryKey(tableName, ctx),
		syncMode: "on-demand",
		queryFn: (ctx) => supabaseQueryFn(supabase, tableName, ctx),
		onInsert: (ctx) => supabaseOnInsert(supabase, tableName, ctx),
		onUpdate: (ctx) => supabaseOnUpdate(supabase, tableName, where, ctx),
		onDelete: (ctx) => supabaseOnDelete(supabase, tableName, where, ctx)
	});
};
const attachSupabaseListeners = (supabase, tableName, collection) => {
	supabase.channel(tableName).on("postgres_changes", {
		event: "*",
		schema: "public",
		table: tableName
	}, async (payload) => {
		if (payload.eventType === "INSERT") collection.utils.writeInsert(payload.new);
		else if (payload.eventType === "UPDATE") collection.utils.writeUpdate(payload.new);
		else if (payload.eventType === "DELETE") {
			const id = collection.getKeyFromItem(payload.old);
			if (collection.has(id)) collection.utils.writeDelete(id);
		}
	}).subscribe();
};
const createSupabaseCollection = ({ tableName, getKey, where, schema, queryClient, supabase }) => {
	const collection = createCollection(supabaseCollectionOptions({
		tableName,
		getKey,
		where,
		schema,
		queryClient,
		supabase
	}));
	attachSupabaseListeners(supabase, tableName, collection);
	return collection;
};

//#endregion
export { createSupabaseCollection };