import { BehaviorSubject, Observable } from "rxjs";

type AnyConstructor<T> = (new (...args: any[]) => T) | (abstract new (...args: any[]) => T);

type ObservableType<T> = {
    readonly [P in keyof T as `_${P & string}$`]: BehaviorSubject<T[P]>;
} &  {
    readonly [P in keyof T as `${P & string}$`]: Observable<T[P]>;
} & T;

type PrototypeOf<T> = T extends AnyConstructor<infer U> ? U : never;

export function observablePropertiesMixin<T extends object, C>(object: T, _constructor?: AnyConstructor<C>) {
    const clazz = class ObservablePropertyMixin extends (_constructor ?? Object) {
        constructor(...args: any[]) {
            super(...args);

            Object.entries(object).forEach(([key, value]) => {
                const behavior = new BehaviorSubject<any>(value);

                Object.defineProperties(this, {
                    [key]: {
                        get: () => (<any>this)[`_${key}$`].value,
                        set: (value) => (<any>this)[`_${key}$`].next(value),
                        enumerable: true
                    },
                    [`_${key}$`]: {
                        value: behavior,
                        enumerable: false
                    },
                    [`${key}$`]: {
                        value: behavior.asObservable(),
                        enumerable: true
                    }
                })
            });
        }
    }

    return clazz as new (...args: any[]) => typeof clazz & ObservableType<T> & PrototypeOf<typeof _constructor>;

}