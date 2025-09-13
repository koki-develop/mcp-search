import type {
	Package as GeneratedPackage,
	KeyValueInput,
} from "./api.generated";

export * from "./api.generated";

export type Transport =
	| {
			type: "stdio";
	  }
	| {
			type: "sse";
			url: string;
			headers?: KeyValueInput[];
	  }
	| {
			type: "streamable-http";
			url: string;
			headers?: KeyValueInput[];
	  };

export type Package = GeneratedPackage & {
	transport: Transport;
};
