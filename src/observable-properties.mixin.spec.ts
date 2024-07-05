import { observablePropertiesMixin } from "./barrel";

describe(`Test of ${observablePropertiesMixin.name}`, () => {
  it("with no class extending neither being passed as parameter", () => {
    const Clazz = observablePropertiesMixin({
      a: "",
      b: 10,
      c: null,
      d: undefined,
    });
    const instance = new Clazz();

    let a, b, c, d;
    instance.a$.subscribe((_) => (a = _));
    instance.b$.subscribe((_) => (b = _));
    instance.c$.subscribe((_) => (c = _));
    instance.d$.subscribe((_) => (d = _));

    expect(instance.a).toEqual(a);
    expect(instance.a).toEqual(instance._a$.value);

    expect(instance.b).toEqual(b);
    expect(instance.b).toEqual(instance._b$.value);

    expect(instance.c).toEqual(c);
    expect(instance.c).toEqual(instance._c$.value);

    expect(instance.d).toEqual(d);
    expect(instance.d).toEqual(instance._d$.value);
  });

  it("with class extending but no class being passed as parameter", () => {
    const x = "Apple",
      y = 33;

    class Clazz extends observablePropertiesMixin({
      a: "",
      b: 10,
      c: null,
      d: undefined,
    }) {
      x = x;
      y = y;
    }

    const instance = new Clazz();

    let a, b, c, d;
    instance.a$.subscribe((_) => (a = _));
    instance.b$.subscribe((_) => (b = _));
    instance.c$.subscribe((_) => (c = _));
    instance.d$.subscribe((_) => (d = _));

    expect(instance.a).toEqual(a);
    expect(instance.a).toEqual(instance._a$.value);

    expect(instance.b).toEqual(b);
    expect(instance.b).toEqual(instance._b$.value);

    expect(instance.c).toEqual(c);
    expect(instance.c).toEqual(instance._c$.value);

    expect(instance.d).toEqual(d);
    expect(instance.d).toEqual(instance._d$.value);

    expect(instance.x).toEqual(x);
    expect(instance.y).toEqual(y);
  });

  it("with class extending and a class being passed as parameter", () => {
    const x = "Apple",
      y = 33,
      z = "Test";

    class AnotherClass {
      z = z;
    }

    class Clazz extends observablePropertiesMixin(
      {
        a: "",
        b: 10,
        c: null,
        d: undefined,
      },
      AnotherClass
    ) {
      x = x;
      y = y;
    }

    const instance = new Clazz();

    let a, b, c, d;
    instance.a$.subscribe((_) => (a = _));
    instance.b$.subscribe((_) => (b = _));
    instance.c$.subscribe((_) => (c = _));
    instance.d$.subscribe((_) => (d = _));

    expect(instance.a).toEqual(a);
    expect(instance.a).toEqual(instance._a$.value);

    expect(instance.b).toEqual(b);
    expect(instance.b).toEqual(instance._b$.value);

    expect(instance.c).toEqual(c);
    expect(instance.c).toEqual(instance._c$.value);

    expect(instance.d).toEqual(d);
    expect(instance.d).toEqual(instance._d$.value);

    expect(instance.x).toEqual(x);
    expect(instance.y).toEqual(y);
    expect(instance.z).toEqual(z);

    expect(instance).toBeInstanceOf(AnotherClass);
  });
});
