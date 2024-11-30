import { first } from "rxjs";
import {
  observableInstancePropertiesMixin,
  observablePropertiesMixin,
} from "./barrel";

const clazzTemplate = { x: "test", y: 1, z: null };
const instanceTemplate = {
  a: "",
  b: 10,
  c: null,
  d: undefined,
};

const template = {
  instance: instanceTemplate,
  clazz: clazzTemplate,
};

function runGeneralClassTests<
  C extends new (...args: any[]) => any,
  T extends ReturnType<
    typeof observablePropertiesMixin<{ clazz: typeof clazzTemplate }, C>
  >
>(Clazz: T) {
  let x, y, z;
  Clazz.x$.pipe(first()).subscribe((_: any) => (x = _));
  Clazz.y$.pipe(first()).subscribe((_: any) => (y = _));
  Clazz.z$.pipe(first()).subscribe((_: any) => (z = _));

  expect(template.clazz.x).toEqual(x);
  expect(template.clazz.y).toEqual(y);
  expect(template.clazz.z).toEqual(z);

  expect(Clazz.x).toEqual(x);
  expect(Clazz.y).toEqual(y);
  expect(Clazz.z).toEqual(z);
}

function runGeneralInstanceTests<
  C extends new (...args: any[]) => any,
  T extends ReturnType<
    typeof observablePropertiesMixin<{ instance: typeof instanceTemplate }, C>
  >
>(instance: InstanceType<T>) {
  let a, b, c, d;
  instance.a$.pipe(first()).subscribe((_: any) => (a = _));
  instance.b$.pipe(first()).subscribe((_: any) => (b = _));
  instance.c$.pipe(first()).subscribe((_: any) => (c = _));
  instance.d$.pipe(first()).subscribe((_: any) => (d = _));

  expect(template.instance.a).toEqual(a);
  expect(template.instance.b).toEqual(b);
  expect(template.instance.c).toEqual(c);
  expect(template.instance.d).toEqual(d);

  expect(instance.a).toEqual(a);
  expect(instance.b).toEqual(b);
  expect(instance.c).toEqual(c);
  expect(instance.d).toEqual(d);
}

function getInstanceAndRunGeneralTests<
  C extends new (...args: any[]) => any,
  T extends ReturnType<typeof observablePropertiesMixin<typeof template, C>>
>(Clazz: T) {
  runGeneralClassTests(Clazz);

  const instance = new Clazz();

  runGeneralInstanceTests(instance);

  return instance;
}

describe(`Test of ${observablePropertiesMixin.name}`, () => {
  it("with no class extending neither being passed as parameter", () => {
    const Clazz = observablePropertiesMixin(template);
    getInstanceAndRunGeneralTests(Clazz);
  });

  it("with class extending but no class being passed as parameter", () => {
    const x = "Apple",
      y = 33;

    class Clazz extends observablePropertiesMixin(template) {
      x = x;
      y = y;
    }
    const instance: Clazz = getInstanceAndRunGeneralTests(Clazz);

    expect(instance.x).toEqual(x);
    expect(instance.y).toEqual(y);
  });

  it("with class extending and a class being passed as parameter", () => {
    const x = "Apple",
      y = 33;

    class AnotherClass {
      static v = "test";
      static w = 10;
    }

    class Clazz extends observablePropertiesMixin(template, AnotherClass) {
      x = x;
      y = y;
    }

    const instance = getInstanceAndRunGeneralTests(Clazz);

    expect(instance).toBeInstanceOf(AnotherClass);

    expect(instance.constructor.v).toEqual(AnotherClass.v);
    expect(instance.constructor.w).toEqual(AnotherClass.w);

    expect(instance.x).toEqual(x);
    expect(instance.y).toEqual(y);
  });

  it("without nested information:", () => {
    class Clazz extends observablePropertiesMixin({ ...instanceTemplate }) {}

    const instance = new Clazz();
    runGeneralInstanceTests(instance);
  });

  it("without nested information:", () => {
    class Clazz extends observablePropertiesMixin({ ...instanceTemplate }) {}

    const instance = new Clazz();
    runGeneralInstanceTests(instance);
  });

  it(`Test of derived classes from '${observableInstancePropertiesMixin.name}': `, () => {
    const x = "Apple",
      y = 33;

    class AnotherClass extends observablePropertiesMixin({
      clazz: template.clazz,
    }) {
      static V = "test";
      static W = 10;
    }

    class Clazz extends observablePropertiesMixin(
      { clazz: { x: "test novo", y: 2 } },
      AnotherClass
    ) {
      x = x;
      y = y;
    }

    expect(AnotherClass.x).not.toEqual(Clazz.x);
  });

  it(`instances with differente properties:`, () => {
    class X extends observablePropertiesMixin({ x: "Teste", y: 2 }) {}

    const a = new X();
    const b = new X();

    expect(a.x$).not.toEqual(b.x$);
    expect(a.y$).not.toEqual(b.y$);
  });
});

describe(`Test of ${observableInstancePropertiesMixin.name}`, () => {
  it("with template:", () => {
    class Clazz extends observableInstancePropertiesMixin({
      ...instanceTemplate,
    }) {}

    const instance = new Clazz();

    runGeneralInstanceTests(instance);
  });

  it("with property changes:", () => {
    class Clazz extends observableInstancePropertiesMixin({
      ...instanceTemplate,
    }) {}

    const b = 100;
    const instance = new Clazz();

    instance.b = b;
    expect(instance.b).toEqual(b);
    instance.b$.pipe(first()).subscribe((_) => expect(_).toEqual(b));
  });

  it("with property overriding:", () => {
    const plus = 10;

    class Clazz extends observableInstancePropertiesMixin({
      ...instanceTemplate,
    }) {
      get b() {
        return super.b + plus;
      }

      set b(value) {
        super.b = value;
      }
    }

    const instance = new Clazz();
    const { b } = instance;

    expect(b).toEqual(instanceTemplate.b + plus);
    instance.b$
      .pipe(first())
      .subscribe((_) => expect(_).toEqual(instanceTemplate.b));
  });
});
