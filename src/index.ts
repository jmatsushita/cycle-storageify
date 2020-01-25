import xs, { Stream } from "xstream";
import debounce from "xstream/extra/debounce";

export type Component<Sources, Sinks> = (sources: Sources) => Sinks;
export type Reducer = (state: any) => any;

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

function serialize(state: any) {
  return JSON.stringify(state);
}

function deserialize(str: string | null) {
  return str === null ? void 0 : JSON.parse(str);
}

export default function storageify<
  Sources extends StateSource,
  Sinks extends StateSink
>(
  Component: Component<Sources, Sinks>,
  options?: Partial<{
    key: string;
    serialize(state: any): string;
    deserialize(stateStr: string): any;
    debounce: number;
  }>
): Component<Sources & StorageSource, Sinks & StorageSink> {
  const _options = {
    // defaults
    key: "storageify",
    serialize,
    deserialize,
    debounce: undefined,
    ...options
  };
  return function(sources: Sources & StorageSource): Sinks & StorageSink {
    const localStorage$ = sources.storage.local.getItem(_options.key).take(1);
    const storedData$ = localStorage$.map(_options.deserialize);
    const state$ = sources.state.stream.compose(
      _options.debounce ? debounce(_options.debounce) : (x: any) => x
    );
    const componentSinks = Component(sources);

    // change initial reducer (first reducer) of component
    // to merge default state with stored state
    const childReducer$ = componentSinks.state;

    const parentReducer$ = storedData$
      .map((storedData: any) =>
        childReducer$.startWith(function initialStorageReducer(prevState: any) {
          if (prevState && storedData) {
            return { ...prevState, ...storedData };
          } else if (prevState) {
            return prevState;
          } else {
            return storedData;
          }
        })
      )
      .flatten();

    const storage$ = state$
      .map(_options.serialize)
      .map((value: any) => ({ key: _options.key, value }));
    const sinks = {
      ...(componentSinks as any),
      state: parentReducer$,
      storage: xs.merge(storage$, (componentSinks as any).storage || xs.never())
    };
    return sinks;
  };
}
