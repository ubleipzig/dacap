import { Component, OnInit, enableProdMode, Output, EventEmitter } from '@angular/core';
import { Cache, Config } from './cache';
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
  config: Config = new Config();

  constructor(private cacheService: CacheService) { }

  ngOnInit(): void {
    this.cacheService.getCaches().then((result) => {
      this.caches = result;
    })

    this.cacheService.getConfig().then((result) => {
      this.config = result;
    })

  }

  logout() {
    this.cacheService.logout().then(() => {
      throw new Error('wrong response');
    }).catch(err => {
      if (err.status !== 401) throw err;
      window.location.href = err.error;
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