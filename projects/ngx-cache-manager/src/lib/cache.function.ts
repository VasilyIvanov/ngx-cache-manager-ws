import { EMPTY, Observable, catchError, from, take } from 'rxjs';
import { DataState, DataStatus } from './cached-data-loader';
import { AbstractCache } from './abstract-cache';

export function cache<K, V>(
  cache: AbstractCache<K, V>,
  physicalLoader: (params: K) => Observable<V> | Promise<V>,
  params: K
): Observable<DataState<V>> {
  return new Observable<DataState<V>>((subscriber) => {
    if (cache.has(params)) {
      const data = cache.get(params);
      subscriber.next({ status: DataStatus.OK, data });
      subscriber.complete();
      return undefined;
    } else {
      subscriber.next({ status: DataStatus.Loading });
      const loader = from(physicalLoader(params));
      return loader
        .pipe(
          take(1),
          catchError((error) => {
            subscriber.next({ status: DataStatus.Error, error });
            subscriber.complete();
            return EMPTY;
          })
        ).subscribe((data) => {
          cache.set(data, params);
          subscriber.next({ status: DataStatus.OK, data });
          subscriber.complete();
        });
    }
  });
}
