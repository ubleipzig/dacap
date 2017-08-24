import { Component, Input } from '@angular/core';
import { CacheService } from './cache.service';
import { CacheComponent } from './cache.component';

import { CacheDetails } from './cache';

@Component({
	selector: 'cache-details',
	templateUrl: './cache-details.component.html'
})

export class CacheDetailsComponent {
	@Input() cache: CacheDetails[];
	@Input() name: string
	@Input() proxyEndPoint: string;

	constructor(private cacheService: CacheService, private cacheComponent: CacheComponent) { }

	delete(hash: string) {
		this.cacheService.deleteValue(this.name, hash).then(() => {
			this.cache = this.cache.filter((item) => {
				return item.hash !== hash;
			});
		});
	}

	refresh(hash: string) {
		this.cacheService.refreshValue(this.name, hash).then((data) => {
			this.cache = this.cache.map((value) => {
				return (value.hash === hash) ? data : value;
			});
		});
	}
}