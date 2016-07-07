/**
 *
 * 更多文件匹配规则
 * @see https://github.com/isaacs/node-glob
 */
'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var url = require('url');
var glob = require('glob');
var mkdirp = require('mkdirp');

var defaultPatternList = [
  {
    find: '([\'"])([/]?%s)(["\'])',
    replace: '$1%s$3'
  }
];


function ReplaceHashPlugin(options) {
  this.options = options || {};
}

ReplaceHashPlugin.prototype.apply = function (compiler) {
  var self = this;
  self.options.cwd = self.options.cwd ? (path.isAbsolute(self.options.cwd) ? self.options.cwd : path.resolve(compiler.options.context, self.options.cwd)) : compiler.options.context;
  self.options.dest = path.isAbsolute(self.options.dest) ? self.options.dest : path.resolve(process.cwd(), self.options.dest);

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
              data = self.doReplace(oldPath, newPath, data);
            }
          });

          // 将rev处理的文件也替换一遍
          if (compiler.revSourceMap) {
            Object.keys(compiler.revSourceMap).forEach(function(item) {
              var newPath = compiler.revSourceMap[item];
              if (self.options.assetsDomain) {
                newPath = url.resolve(self.options.assetsDomain, newPath);
              }
              data = self.doReplace(item, newPath, data);
            });
          }

          var dest = path.resolve(self.options.dest, file);
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

ReplaceHashPlugin.prototype.doReplace = function (oldPath, newPath, data) {
  (this.options.pattern || defaultPatternList).forEach(function(pattern) {
    var search = util.format(pattern.find, oldPath);
    var replacement = util.format(pattern.replace, newPath);
    var regexp = new RegExp(search, 'gm');
    // var regexp = new RegExp(`(["'=])([/]?${oldPath})`, 'g');
    data = data.replace(regexp, replacement);
  });
  return data;
}

module.exports = ReplaceHashPlugin;
