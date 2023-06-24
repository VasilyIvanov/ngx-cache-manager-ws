export function cache() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    //console.log('DECORATOR', target, propertyKey, descriptor);
    const original = descriptor.value;

    descriptor.value = function (...args: any) {
      //console.log('params: ', args);
      const result = original.call(this, ...args);
      //console.log('result: ', result);
      return result;
    };
  }
}
