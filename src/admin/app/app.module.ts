import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AddCacheComponent } from './add-cache.component';
import { CacheComponent } from './cache.component';
import { CacheDetailsComponent } from './cache-details.component';
import { CacheOptionsComponent } from './cache-options.component';
import { CacheStatsComponent } from './cache-stats.component';

import { KeysPipe } from './keys.pipe';

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule
	],
	declarations: [
		AppComponent,
		AddCacheComponent,
		CacheComponent,
		CacheDetailsComponent,
		CacheOptionsComponent,
		CacheStatsComponent,
		KeysPipe
	],
	bootstrap: [AppComponent]
})
export class AppModule { }