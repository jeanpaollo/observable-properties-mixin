import { BehaviorSubject, Observable } from "rxjs";

type Template<I extends object = {}, C extends object = {}> =
  | I
  | { instance: I }
  | { clazz: C }
  | { instance: I; clazz: C };

type AnyConstructor<T extends object = {}> =
  | (new (...args: any[]) => T)
  | (abstract new (...args: any[]) => T);

type ObservableType<T> = {
  readonly [P in keyof T as `${P & string}$`]: Observable<T[P]>;
} & {
  [P in keyof T]: T[P];
};

function generateSourceFrom<T extends { [key: string]: any }>(template: T) {
  return Object.entries(template).map(([key, value]) => ({
    key,
    symbol: Symbol(`${key}BehaviorSubject`),
    value,
  }));
}

export const getterAndSetterPropertyGenerator = <T extends object = {}>(
  target: T,
  propertyName: string | symbol,
  symbol: symbol
) =>
  Object.defineProperties(target, {
    [propertyName]: {
      get() {
        return (<BehaviorSubject<any>>(<any>this)[symbol]).value;
      },
      set(value: any) {
        return (<BehaviorSubject<any>>(<any>this)[symbol]).next(value);
      },
      enumerable: true,
    },
  });

export const behaviorSubjectPropertyGenerator = <
  T extends object = {},
  V = any
>(
  target: T,
  propertyName: string,
  symbol: symbol,
  value: V
) => {
  const behaviorSubject = new BehaviorSubject(value);
  Object.defineProperties(target, {
    [symbol]: {
      value: behaviorSubject,
      writable: false,
      enumerable: false,
    },
    [`${propertyName}$`]: {
      value: behaviorSubject.asObservable(),
      enumerable: true,
    },
  });
};

export function observablePropertiesMixin<
  T extends Template,
  C extends AnyConstructor = ObjectConstructor
>(template: T, _constructor: C = Object as unknown as C) {
  const instanceSource =
    "instance" in template
      ? generateSourceFrom(template["instance"])
      : !("clazz" in template)
      ? generateSourceFrom(template)
      : [];

  class ObservablePropertyMixin extends _constructor {
    constructor(...args: any[]) {
      super(...args);

      instanceSource.forEach(({ key, symbol, value }) =>
        behaviorSubjectPropertyGenerator(this, key, symbol, value)
      );
    }
  }

  instanceSource.forEach(({ key, symbol }) =>
    getterAndSetterPropertyGenerator(
      ObservablePropertyMixin.prototype,
      key,
      symbol
    )
  );

  if ("clazz" in template)
    generateSourceFrom(template["clazz"]).forEach(({ key, value, symbol }) => {
      getterAndSetterPropertyGenerator(ObservablePropertyMixin, key, symbol);
      behaviorSubjectPropertyGenerator(
        ObservablePropertyMixin,
        key,
        symbol,
        value
      );
    });

  type FinalClass<T extends Template> = {
    new (...args: any[]): InstanceType<typeof ObservablePropertyMixin> &
      ObservableType<"instance" extends keyof T ? T["instance"] : T>;
    prototype: ReturnType<typeof observablePropertiesMixin<any, any>>;
  } & typeof ObservablePropertyMixin &
    C &
    ("clazz" extends keyof T ? ObservableType<T["clazz"]> : {});

  return ObservablePropertyMixin as FinalClass<T>;
}

export const observableInstancePropertiesMixin = <
  S extends object,
  C extends AnyConstructor
>(
  source: S,
  _constructor?: C
) => observablePropertiesMixin({ instance: source, _constructor });
