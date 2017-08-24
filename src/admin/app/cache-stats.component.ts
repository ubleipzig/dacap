import { Component, Input } from '@angular/core';

import { CacheStats } from './cache';

@Component({
	selector: 'cache-stats',
	template: `
	<label>Cache Stats:</label>
	<div class="table-responsive">
	<table class="table table-bordered table-striped">
			<tr *ngFor="let item of data | keys">
				<th class="text-nowrap" scope="row">{{item.key}}</th>
				<td>{{item.value}}</td>
			</tr>
		</table>
	</div>
	`
})

export class CacheStatsComponent {
	@Input() data: CacheStats
}