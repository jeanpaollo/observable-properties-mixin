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

export const observablePropertiesGenerator = <
  T extends object = {},
  O extends object = {}
>(
  target: T,
  template: O
): T & ObservableType<O> => {
  Object.entries(template).forEach(([key, value]) => {
    const behavior = new BehaviorSubject<any>(value);

    Object.defineProperties(target, {
      [key]: {
        get() {
          return behavior.value;
        },
        set(value) {
          return behavior.next(value);
        },
        enumerable: true,
      },
      [`${key}$`]: {
        value: behavior.asObservable(),
        enumerable: true,
      },
    });
  });

  return target as T & ObservableType<O>;
};

export function observablePropertiesMixin<
  T extends Template,
  C extends AnyConstructor = ObjectConstructor
>(template: T, _constructor: C = Object as unknown as C) {
  class ObservablePropertyMixin extends _constructor {
    constructor(...args: any[]) {
      super(...args);

      "instance" in template &&
        observablePropertiesGenerator(this, template["instance"]);

      !("instance" in template) &&
        !("clazz" in template) &&
        observablePropertiesGenerator(this, template);
    }
  }

  "clazz" in template &&
    observablePropertiesGenerator(ObservablePropertyMixin, template["clazz"]);

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
