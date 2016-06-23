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
var glob = require('glob');

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
          var publicPath = compiler.options.output.publicPath;
          var filename = compiler.options.output.filename;
          Object.keys(stats.compilation.assets).forEach(function(item) {
            var ext = path.extname(item); //.js
            var name = path.basename(item, ext); //main-e1bb26
            // 只处理html中的css、js
            if (['.js', '.css'].indexOf(path.extname(item)) != -1) {
              var oldFilename = item.replace(/-\w*\./, '.'); // main.js
              var oldPath = path.join(publicPath, oldFilename); // /assets/main.js
              var newPath = path.join(publicPath, item);
              data = data.replace(oldPath, newPath);
            }
          });

          var dest = path.join(self.options.dest, file);
          var destDir = path.dirname(dest);
          // console.log(dest, destDir, fs.existsSync(destDir));
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
          }
          fs.writeFileSync(dest, data);
          console.log(`${dest} created.`);

        });
      });
    });
  });
};

module.exports = ReplaceHashPlugin;
