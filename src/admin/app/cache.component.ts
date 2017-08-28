import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CacheService } from './cache.service';
import { AppComponent } from './app.component';

import { Cache } from './cache';

@Component({
	selector: 'cache',
	templateUrl: './cache.component.html'
})

export class CacheComponent {
	@Input() data: Cache;
	@Input() proxyUrl: string
	@Output() onDelete: EventEmitter<string> = new EventEmitter();

	constructor(private cacheService: CacheService, private appComponent: AppComponent) { }

	@Output()
	delete() {
		this.cacheService.deleteCache(this.data.name).then(() => {
			this.onDelete.emit(this.data.name)
		});
	}

	flush() {
		this.cacheService.flushCache(this.data.name).then((data) => {
			this.data = data;
		});
	}
}