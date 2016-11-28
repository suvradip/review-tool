var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('watch:server', function () {
    nodemon({
        script: 'server.js',
        ext: 'js'
    });
});


gulp.task('dev', ['watch:server']);
