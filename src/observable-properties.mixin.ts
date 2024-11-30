import { ValueSetEvent } from "chained-event-implementations";
import {
  map,
  merge,
  Observable,
  of,
  share,
  shareReplay,
  Subject,
  switchMap,
} from "rxjs";

class SubjectWithValueHolder<T> extends Subject<T> {
  private _value: T;

  private readonly _valueChange$ = new Subject<T>();

  get value() {
    return this._value;
  }

  readonly valueChange$ = of(null).pipe(switchMap(() => this._valueChange$));

  readonly value$ = of(null).pipe(
    switchMap(() => merge(of(this._value), this.valueChange$)),
    shareReplay(1)
  );

  readonly valueSetEvent$ = of(null).pipe(
    switchMap(() => this.valueChange$),
    map((value) => new ValueSetEvent({ value })),
    share()
  );

  constructor(value: T) {
    super();
    this._value = value;
  }

  override next(value: T): void {
    return super.next((this._value = value));
  }
}

type Template<I extends object = {}, C extends object = {}> =
  | I
  | { instance: I }
  | { clazz: C }
  | { instance: I; clazz: C };

type AnyConstructor<T extends object = {}> =
  | (new (...args: any[]) => T)
  | (abstract new (...args: any[]) => T);

type InstanceMap<T> = {
  readonly [P in keyof T as `${P & string}$`]: Observable<T[P]>;
} & {
  readonly [P in keyof T as `${P & string}Change$`]: Observable<T[P]>;
} & {
  readonly [P in keyof T as `${P & string}ValueSetEvent$`]: Observable<
    ValueSetEvent<T[P]>
  >;
};

type PrototypeMap<T> = {
  [P in keyof T]: T[P];
};

type ObservableType<T> = InstanceMap<T> & PrototypeMap<T>;

function propertyDescriptorMapAndSymbolBinder<T extends object>(template: T) {
  return Object.entries(template).map(([key, value]) => {
    const symbol = Symbol(key);

    return {
      propertyDescriptor: {
        [key]: {
          get() {
            return (<any>this)[symbol].value;
          },
          set(value: any) {
            (<any>this)[symbol].next(value);
          },
          enumerable: true,
        },
        [`${key}$`]: {
          get() {
            const value = (<any>this)[symbol].value$;

            Object.defineProperty(this, `${key}$`, { value });

            return (<any>this)[symbol].value$;
          },
          enumerable: true,
          configurable: true,
        },
        [`${key}Change$`]: {
          get() {
            const value = (<any>this)[symbol].valueChange$;

            Object.defineProperty(this, `${key}Change$`, { value });

            return value;
          },
          enumerable: true,
          configurable: true,
        },
        [`${key}ValueSetEvent$`]: {
          get() {
            const value = (<any>this)[symbol].valueSetEvent$;

            Object.defineProperty(this, `${key}ValueSetEvent$`, { value });

            return value;
          },
          enumerable: true,
          configurable: true,
        },
      },
      symbol,
      initializer: (target: any) => {
        Object.defineProperty(target, symbol, {
          value: new SubjectWithValueHolder(value),
        });
      },
    };
  });
}

export function observablePropertiesMixin<
  T extends Template,
  C extends AnyConstructor = ObjectConstructor
>(template: T, constructor: C = Object as unknown as C) {
  const propertyDescriptorList =
    "instance" in template
      ? propertyDescriptorMapAndSymbolBinder(template["instance"])
      : !("clazz" in template)
      ? propertyDescriptorMapAndSymbolBinder(template)
      : [];

  class ObservablePropertyMixin extends constructor {
    constructor(...args: any[]) {
      super(...args);

      propertyDescriptorList.forEach((e) => e.initializer(this));
    }
  }

  propertyDescriptorList.forEach((e) =>
    Object.defineProperties(
      ObservablePropertyMixin.prototype,
      e.propertyDescriptor
    )
  );

  if ("clazz" in template) {
    const propertyDescriptorList = propertyDescriptorMapAndSymbolBinder(
      template["clazz"]
    );

    propertyDescriptorList.forEach((propertyDescriptor) => {
      propertyDescriptor.initializer(ObservablePropertyMixin);

      Object.defineProperties(
        ObservablePropertyMixin,
        propertyDescriptor.propertyDescriptor
      );
    });
  }

  type FinalClass<T extends Template> = {
    new (...args: any[]): InstanceType<typeof ObservablePropertyMixin> &
      ObservableType<"instance" extends keyof T ? T["instance"] : T>;
    prototype: ReturnType<typeof observablePropertiesMixin<any, any>>;
  } & typeof ObservablePropertyMixin &
    C &
    ("clazz" extends keyof T ? ObservableType<T["clazz"]> : {});

  return ObservablePropertyMixin as unknown as FinalClass<T>;
}

export const observableInstancePropertiesMixin = <
  S extends object,
  C extends AnyConstructor = ObjectConstructor
>(
  source: S,
  constructor: C = Object as unknown as C
) => observablePropertiesMixin({ instance: source, constructor });
