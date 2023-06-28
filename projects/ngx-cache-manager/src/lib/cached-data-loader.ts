import { BehaviorSubject, catchError, defer, isObservable, map, Observable, of, Subscription, take } from 'rxjs';
import { AbstractCache } from './abstract-cache';

export class CachedDataLoader<K, V> {
  private readonly subj$ = new BehaviorSubject<DataState<V>>({ status: DataStatus.Inactive });
  private subscription: Subscription | undefined;

  private observable$: Observable<DataState<V>> | undefined;
  private dataObservable$: Observable<V | undefined> | undefined;
  private statusObservable$: Observable<DataStatus> | undefined;
  private loadingObservable$: Observable<boolean> | undefined;

  public constructor(
    private readonly cache: AbstractCache<K, V>,
    private readonly physicalLoader: (params: K) => Observable<V> | Promise<V>
  ) { }

  public subscribe(next: (value: DataState<V>) => void): Subscription {
    return this.subj$.subscribe(next);
  }

  public asObservable(): Observable<DataState<V>> {
    return this.observable$ ?? (this.observable$ = this.subj$.asObservable());
  }

  public asDataObservable(): Observable<V | undefined> {
    return this.dataObservable$ ?? (this.dataObservable$ = this.subj$.pipe(map((result) => result?.data)));
  }

  public asStatusObservable(): Observable<DataStatus> {
    return this.statusObservable$ ?? (this.statusObservable$ = this.subj$.pipe(map((result) => result?.status)));
  }

  public asLoadingObservable(): Observable<boolean> {
    return this.loadingObservable$ ?? (this.loadingObservable$ = this.subj$.pipe(map((result) => result?.status === DataStatus.Loading)));
  }

  public get(params: K): void {
    if (this.cache.has(params)) {
      const data = this.cache.get(params);
      this.subj$.next({ status: DataStatus.OK, data });
    } else {
      this.subj$.next({ status: DataStatus.Loading });

      const loader = this.physicalLoader(params);
      const loaderObservable = isObservable(loader) ? loader : defer(() => loader);

      this.subscription?.unsubscribe();
      this.subscription = loaderObservable
        .pipe(
          take(1),
          catchError((error) => {
            this.subj$.next({ status: DataStatus.Error, error });
            return of(undefined);
          })
        )
        .subscribe((data) => {
          this.subscription = undefined;

          if (this.subj$.value.status === DataStatus.Loading) {
            //this.cache.set(params as any, data as any);
            this.subj$.next({ status: DataStatus.OK, data });
          }
        });
    }
  }

  public cancel(): void {
    this.subscription?.unsubscribe();
    this.subj$.next({ status: DataStatus.Inactive });
  }
}

export interface DataState<V> {
  readonly status: DataStatus;
  readonly data?: V;
  readonly error?: any;
}

export enum DataStatus {
  Inactive = 1,
  Loading,
  OK,
  Error
}
