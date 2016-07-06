/**
 * @todo 根据webpack.config.output.filename规则替换
 *       目前只支持这种格式[name]-[chunkhash].js
 *
 * 更多文件匹配规则
 * @see https://github.com/isaacs/node-glob
 */
'use strict';

var path = require('path');
var fs = require('fs');
var url = require('url');
var glob = require('glob');
var mkdirp = require('mkdirp');

function ReplaceHashPlugin(options) {
  this.options = options || {};
}

ReplaceHashPlugin.prototype.apply = function (compiler) {
  var self = this;
  self.options.cwd = self.options.cwd || compiler.options.context;

  glob(self.options.src, self.options, function (err, files) {
    files.forEach(function(file) {
      var fullpath = path.join(self.options.cwd, file);
      fs.readFile(fullpath, 'utf8', function (err, data) {
        compiler.plugin('done', function (stats) {
          // require("fs").writeFileSync(
          //   path.join(process.cwd(), "stats.json"),
          //   JSON.stringify(stats.toJson())
          // );

          var publicPath = compiler.options.output.publicPath;
          var jsChunkFileName = compiler.options.output.filename;
          var cssChunkFileName;
          // 找出ExtractTextPlugin插件在plugins中的位置
          compiler.options.plugins.forEach(function(pluginConfig) {
            if (pluginConfig.filename) {
              cssChunkFileName = pluginConfig.filename;
            }
          });
          Object.keys(stats.compilation.assets).forEach(function(item) {
            var ext = path.extname(item); //.js
            var name = path.basename(item, ext); //main-e1bb26
            // console.log(item);
            // 只处理html中的css、js
            if (['.js', '.css'].indexOf(ext) != -1) {
              var filename;
              if (ext === '.js') {
                filename = jsChunkFileName;
              }
              if (ext === '.css') {
                filename = cssChunkFileName;
              }
              var hashLengthMatches = filename.match(/\[\S*hash:(\d)\]/i);
              var hashLength;
              if (hashLengthMatches[1]) {
                hashLength = hashLengthMatches[1];
              }
              var regString = filename
                .replace('[name]','(\\S+)')
                .replace(`[chunkhash:${hashLength}]`, `\\w{${hashLength}}`)
                .replace(`[hash:${hashLength}]`, `\\w{${hashLength}}`);
              var matches = item.match(new RegExp(regString));
              var oldFilename = matches[1] + ext;
              var oldPath = path.join(publicPath, oldFilename); // /assets/main.js
              var newPath = path.join(publicPath, item);
              if (self.options.assetsDomain) {
                newPath = url.resolve(self.options.assetsDomain, newPath);
              }
              var regexp = new RegExp(`(["'=])([/]?${oldPath})`, 'g');
              var replacement = `$1${newPath}`;
              data = data.replace(regexp, replacement);
            }
          });

          // 将rev处理的文件也替换一遍
          if (compiler.revSourceMap) {
            Object.keys(compiler.revSourceMap).forEach(function(item) {
              var newPath = compiler.revSourceMap[item];
              if (self.options.assetsDomain) {
                newPath = url.resolve(self.options.assetsDomain, newPath);
              }
              var regexp = new RegExp(`(["'=])([/]?${item})`, 'g');
              var replacement = `$1${newPath}`;
              data = data.replace(regexp, replacement);
            });
          }

          var dest = path.join(self.options.dest, file);
          var destDir = path.dirname(dest);
          if (!fs.existsSync(destDir)) {
            mkdirp.sync(destDir);
          }
          fs.writeFileSync(dest, data);
          console.log(`${dest} created.`);

        });
      });
    });
  });
};

module.exports = ReplaceHashPlugin;
