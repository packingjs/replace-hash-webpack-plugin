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
var mkdirp = require('mkdirp');
var endsWith = require('lodash.endswith');
var packingGlob = require('packing-glob');

var defaultPatternList = [
  {
    find: '([\'"])([/]?%s)(["\'])',
    replace: '$1%s$3'
  }
];

function ReplaceHashPlugin(options) {
  this.options = options || {};
  if (!this.options.exts) {
    this.options.exts = ['js', 'css', 'png', 'jpg'];
  }
}

ReplaceHashPlugin.prototype.apply = function (compiler) {
  var self = this;
  self.options.cwd = self.options.cwd ? (path.isAbsolute(self.options.cwd) ? self.options.cwd : path.resolve(compiler.options.context, self.options.cwd)) : compiler.options.context;
  self.options.dest = path.isAbsolute(self.options.dest) ? self.options.dest : path.resolve(process.cwd(), self.options.dest);

  compiler.plugin('done', function (stats) {
    var publicPath = compiler.options.output.publicPath;
    var jsChunkFileName = compiler.options.output.filename;
    var cssChunkFileName;
    // 找出ExtractTextPlugin插件在plugins中的位置
    compiler.options.plugins.forEach(function(pluginConfig) {
      if (pluginConfig.filename) {
        cssChunkFileName = pluginConfig.filename;
      }
    });

    var patterns = self.options.src;
    packingGlob(patterns, self.options).forEach(function(file) {
      var fullpath = path.join(self.options.cwd, file);
      var data = fs.readFileSync(fullpath, 'utf8');

      Object.keys(stats.compilation.assets).filter(function(item) {
        return self.options.exts.some(function(e) {
          return endsWith(item, e);
        });
      }).forEach(function(item) {
        var ext = path.extname(item); //.js
        var name = path.basename(item, ext); //main-e1bb26
        var filename;

        switch (ext) {
          case '.js':
            filename = jsChunkFileName;
            break;
          case '.css':
            filename = cssChunkFileName;
            break;
          default:
            compiler.options.module.rules.forEach(function(rule) {
              if (rule.test.test(ext)) {
                var query = rule.query || rule.options;
                if (rule.use) {
                  rule.use.forEach(function(use) {
                    if (use.loader === 'url' ||
                      use.loader === 'url-loader' ||
                      use.loader === 'file' ||
                      use.loader === 'file-loader') {
                      query = use.query || use.options;
                    }
                  })
                }
                if (query) {
                  filename = query.name;
                } else {
                  filename = '[hash].[ext]';
                }
              }
            })
        }
        var hashLengthMatches = filename.match(/\[\S*hash:(\d+)\]/i);
        var hashLength;
        if (hashLengthMatches) {
          if (hashLengthMatches[1]) {
            hashLength = hashLengthMatches[1];
          }
          var regString = filename
            .replace('\[name\]', '(\\S+)')
            .replace('\[ext\]', ext.substr(1, ext.length))
            .replace('\[chunkhash:' + hashLength + '\]', '\\w{' + hashLength + '}')
            .replace('\[contenthash:' + hashLength + '\]', '\\w{' + hashLength + '}')
            .replace('\[hash:' + hashLength + '\]', '\\w{' + hashLength + '}');
          var matches = item.match(new RegExp(regString));
          if (matches) {
            var oldFilename = matches[1] + ext;
            var oldPath = oldFilename;
            var newPath = publicPath + item;
            data = self.doReplace(oldPath, newPath, data);
          } else {
            console.log('[warnings]%s replace hash failed.', item);
          }
        } else {
          console.log('[warnings]matching filename failed. filename: %s', filename);
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
      console.log('%s created.', dest);

    });


  });

};

ReplaceHashPlugin.prototype.doReplace = function (oldPath, newPath, data) {
  (this.options.pattern || defaultPatternList).forEach(function(pattern) {
    var search = util.format(pattern.find, oldPath);
    var replacement = util.format(pattern.replace, newPath);
    var regexp = new RegExp(search, 'gm');
    data = data.replace(regexp, replacement);
  });
  return data;
}

module.exports = ReplaceHashPlugin;
