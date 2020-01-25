var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import xs from "xstream";
import debounce from "xstream/extra/debounce";
function serialize(state) {
    return JSON.stringify(state);
}
function deserialize(str) {
    return str === null ? void 0 : JSON.parse(str);
}
export default function storageify(Component, options) {
    var _options = __assign({ 
        // defaults
        key: "storageify", serialize: serialize,
        deserialize: deserialize, debounce: undefined }, options);
    return function (sources) {
        var localStorage$ = sources.storage.local.getItem(_options.key).take(1);
        var storedData$ = localStorage$.map(_options.deserialize);
        var state$ = sources.state.stream.compose(_options.debounce ? debounce(_options.debounce) : function (x) { return x; });
        var componentSinks = Component(sources);
        // change initial reducer (first reducer) of component
        // to merge default state with stored state
        var childReducer$ = componentSinks.state;
        var parentReducer$ = storedData$
            .map(function (storedData) {
            return childReducer$.startWith(function initialStorageReducer(prevState) {
                if (prevState && storedData) {
                    return __assign(__assign({}, prevState), storedData);
                }
                else if (prevState) {
                    return prevState;
                }
                else {
                    return storedData;
                }
            });
        })
            .flatten();
        var storage$ = state$
            .map(_options.serialize)
            .map(function (value) { return ({ key: _options.key, value: value }); });
        var sinks = __assign(__assign({}, componentSinks), { state: parentReducer$, storage: xs.merge(storage$, componentSinks.storage || xs.never()) });
        return sinks;
    };
}
//# sourceMappingURL=index.js.map