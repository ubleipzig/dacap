import { Component, OnInit, enableProdMode } from '@angular/core';
import { Cache } from './cache';
import { CacheService } from './cache.service';

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  providers: [
    CacheService
  ]
})

export class AppComponent implements OnInit {
  caches: Cache[];

  constructor(private cacheService: CacheService) { }

  ngOnInit(): void {
    this.cacheService.getCaches().then((result) => {
      this.caches = result;
    })

  }

  addCache(cache: Cache) {
    this.caches.push(cache);
  }

  removeCache(name: string) {
    this.caches = this.caches.filter((value) => {
      return value.name !== name;
    })
  }
}