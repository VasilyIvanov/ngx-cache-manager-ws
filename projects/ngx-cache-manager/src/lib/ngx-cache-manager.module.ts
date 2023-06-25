import { Injector, NgModule } from '@angular/core';

@NgModule({
  declarations: [
  ],
  imports: [
  ],
  exports: [
  ]
})
export class NgxCacheManagerModule {
  public static injector: Injector;

  public constructor(injector: Injector) {
    NgxCacheManagerModule.injector = injector;
  }
}
