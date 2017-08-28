import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CacheService } from './cache.service';
import { Cache } from './cache';

@Component({
	selector: 'add-cache',
	templateUrl: './add-cache.component.html'
})

export class AddCacheComponent {
	name: string;
	apiEndPoint: string;
	@Input () proxyUrl: string;
	@Output() onAdd: EventEmitter<Cache> = new EventEmitter();

	constructor(private cacheService: CacheService) { }

	submit() {
		this.cacheService.addCache(this.name, { apiEndPoint: this.apiEndPoint, cacheOptions: {} }).then((cache) => {
			this.onAdd.emit(cache);
		})
	}
}