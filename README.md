# Replace Hash Webpack plugin

[![NPM](https://nodei.co/npm/replace-hash-webpack-plugin.png)](https://nodei.co/npm/replace-hash-webpack-plugin/)

This is a [webpack](http://webpack.github.io/) plugin that update script references in HTML files by webpack bundle's hash.

 It uses the [glob](https://github.com/isaacs/node-glob) library to do files matching.

## Installation

Install the plugin with npm:
```shell
$ npm install replace-hash-webpack-plugin --save-dev
```

## Configuration

You can pass a hash of configuration options to `ReplaceHashWebpackPlugin`.
Allowed values are as follows:

- `cwd`: The current work directory.
- `src`: The original pattern the minimatch object represents.
- `dest`: Dest files save path.
- `pattern`: {Array} (optional) Find and replace rules.
- `exts`: {Array} (optional) Asset types to be replaced. Default: ['js', 'css']

## Example

```javascript
//webpack.config.js
var ReplaceHashWebpackPlugin = require('replace-hash-webpack-plugin');
var webpackConfig = {
  entry: 'main.js',
  output: {
    filename: '[name]-[hash:8].js',
    publicPath: 'http://www.cdn.com/js/',
  },
  plugins: [
    new ReplaceHashWebpackPlugin({
      cwd: 'static',
      src: '**/*.jade',
      dest: 'prd',
    }),
    // new ReplaceHashWebpackPlugin({
    //   cwd: process.cwd() + '/static',
    //   src: '**/*.html',
    //   dest: process.cwd() + '/prd',
    //   exts: ['png', 'jpg', 'jpeg'],
    //   pattern: [
    //     {
    //       find: '([\'"])([/]?%s)(["\'])',
    //       replace: '$1%s$3'
    //     }
    //   ]
    // }),
  ]
};
```

```html
<!-- static/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>replace-hash-webpack-plugin</title>
</head>
<body>
  <script src="/js/main.js"></script>
</body>
</html>
```

#### result:

```html
<!-- prd/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>replace-hash-webpack-plugin</title>
</head>
<body>
  <script src="http://www.cdn.com/js/main-e8f4f5aa.js"></script>
</body>
</html>
```
