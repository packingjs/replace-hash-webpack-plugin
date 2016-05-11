/**
 * @todo src/dest 支持多文件
 */
'use strict';

var path = require('path');
var fs = require('fs');

function ReplaceHashPlugin(config) {
  this.src = config.src;
  this.dest = config.dest;
}

ReplaceHashPlugin.prototype.apply = function (compiler) {
  var self = this;
  var folder = compiler.options.context;
  var src = path.join(folder, self.src);
  var dest = path.join(folder, self.dest);

  fs.readFile(src, 'utf8', function (err, data) {
    compiler.plugin('done', function (stats) {
      var publicPath = compiler.options.output.publicPath;
      var filename = compiler.options.output.filename;
      compiler.options.entry.forEach(function(item) {
        var ext = path.extname(item); //.js
        var name = path.basename(item, ext); //main
        var hashedName = filename.replace('[name]', name).replace('[hash]', stats.hash);
        var jsSrc = path.join(publicPath, name + ext);
        var hashedSrc = path.join(publicPath, hashedName);
        data = data.replace(jsSrc, hashedSrc);
        fs.writeFileSync(dest, data);
      });
    });
  });
};

module.exports = ReplaceHashPlugin;
