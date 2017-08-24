const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	entry: {
		app: './src/admin/main.ts',
		vendor: './src/admin/vendor.ts',
		polyfills: './src/admin/polyfills.ts'
	},
	output: {
		filename: '[name].js',
		path: __dirname + '/public',
		publicPath: '/admin/'
	},

	resolve: {
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: [".ts", ".js"]
	},

	module: {
		rules: [
			// All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
			{
				test: /\.ts$/,
				loaders: [{
						loader: "awesome-typescript-loader",
						options: {
							configFileName: path.resolve(__dirname, 'src', 'admin', 'tsconfig.json')
						}
					},
					{
						loader: "angular2-template-loader"
					}
				]
			},
			{
				test: /\.html$/,
				include: path.resolve(__dirname, 'src', 'admin'),
				loader: 'html-loader'
			},
			{
				test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
				loader: 'file-loader?name=assets/[name].[hash].[ext]'
			},
			{
				test: /\.css$/,
				exclude: path.resolve(__dirname, 'src', 'admin', 'app'),
				loader: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: 'css-loader?sourceMap'
				})
			},
			{
				test: /\.css$/,
				include: path.resolve(__dirname, 'src', 'admin', 'app'),
				loader: 'raw-loader'
			}
		],
	},
	plugins: [
		// Workaround for angular/angular#11580
		new webpack.ContextReplacementPlugin(
			// The (\\|\/) piece accounts for path separators in *nix and Windows
			/angular(\\|\/)core(\\|\/)@angular/,
			path.resolve(__dirname, 'src', 'admin'), // location of your src
			{} // a map of your routes
		),

		new webpack.optimize.CommonsChunkPlugin({
			name: ['app', 'vendor', 'polyfills']
		}),

		new HtmlWebpackPlugin({
			template: 'src/admin/index.html'
		}),

		new webpack.ProvidePlugin({
			$: "jquery",
			jquery: "jquery",
			"window.jQuery": "jquery",
			jQuery:"jquery"
		})
	]
};