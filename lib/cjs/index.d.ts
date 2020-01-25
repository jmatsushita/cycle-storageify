import { Stream } from "xstream";
export declare type Component<Sources, Sinks> = (sources: Sources) => Sinks;
export declare type Reducer = (state: any) => any;
export interface StateSource {
    state: any;
}
export interface StateSink {
    state: any;
}
export interface StorageSource {
    storage: any;
}
export interface StorageSink {
    storage: Stream<Reducer>;
}
export default function storageify<Sources extends StateSource, Sinks extends StateSink>(Component: Component<Sources, Sinks>, options?: Partial<{
    key: string;
    serialize(state: any): string;
    deserialize(stateStr: string): any;
    debounce: number;
}>): Component<Sources & StorageSource, Sinks & StorageSink>;
