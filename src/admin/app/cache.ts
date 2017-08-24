
export class Cache {
	name: string;
	apiEndPoint: string;
	proxyEndPoint: string;
	cacheOptions: CacheOptions;
	cacheStats: CacheStats;
	cache: CacheDetails[];
}

export class CacheOptions {
	forceString: boolean;
	objectValueSize: number;
	arrayValueSize: number;
	stdTTL: number;
	checkPeriod: number;
	useClones: boolean;
	errorOnMissing: boolean;
	deleteOnExpire: boolean;
}

export class CacheStats {
	hits: number;
	misses: number;
	keys: number;
	ksize: number;
	vsize: number;
}

export class CacheDetails {
	hash: string;
	ttl: number;
	uriPath: string;
	contentType: string;
	size: number;
}