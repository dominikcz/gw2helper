export type TransactionLike = {
    id: number;
    item_id: number;
    price: number;
    quantity: number;
};

export type TransactionExpandedLike = {
    transId: number;
    id: number;
    item_id: number;
    price: number;
    count: number;
    [key: string]: unknown;
};

export function mapTransactionsForCurrent<T extends TransactionLike>(data: T[]): Array<T & TransactionExpandedLike> {
    return data.map((x) => ({
        ...x,
        transId: x.id,
        id: x.item_id,
        count: x.quantity,
    }));
}

export function sumQuantitiesByItemAndPrice<T extends { item_id: number; price: number; count: number }>(data: T[]): T[] {
    return Object.values(data.reduce((result: Record<string, T>, item) => {
        const key = `${item.item_id}-${item.price}`;
        if (result[key]) {
            result[key].count += item.count;
        } else {
            result[key] = { ...item };
        }
        return result;
    }, {}));
}
