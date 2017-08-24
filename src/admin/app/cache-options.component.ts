import { Component, Input } from '@angular/core';
import { CacheOptions } from './cache';

@Component({
	selector: 'cache-options',
	template: `
		<label>Cache Options:</label>
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

export class CacheOptionsComponent {
	@Input() data: CacheOptions
}