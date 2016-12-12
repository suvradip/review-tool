var gulp 			= require('gulp'),
 	nodemon 		= require('gulp-nodemon'),
	sass            = require( 'gulp-sass' ),
    browserSync     = require( 'browser-sync'),
    reload          = browserSync.reload,
    autoprefixer    = require( 'gulp-autoprefixer' ),
    gutil           = require( 'gulp-util' ),
    plumber         = require( 'gulp-plumber' );

gulp.task('watch:server', function () {
    nodemon({
        script: 'server.js',
        ext: 'js'
    });
});




///////////////////////////////////////////
//
//	Task: Compile stylesheet.sass and save it as stylesheet.css
//	
//////////////////////////////////////////

gulp.task( 'sass', function() {
    gulp.src("./public/sass/*.scss")
        .pipe(plumber(function(error) {
            gutil.log(gutil.colors.red(error.message));
            this.emit('end');
        })) // report errors w/o stopping Gulp
        .pipe(sass())
        .pipe(autoprefixer({browsers: ['last 3 version']}))
        .pipe( gulp.dest("./public/css") )
        .pipe(reload({stream:true}));
});


///////////////////////////////////////////
//
//	Task: HTML 
//	
//////////////////////////////////////////

gulp.task( 'html', function() {
    gulp.src("./views/index.ejs")
        .pipe(plumber(function(error) {
            gutil.log(gutil.colors.red(error.message));
            this.emit('end');
        })) // report errors w/o stopping Gulp 
        //.pipe( gulp.dest("./views/") )
        .pipe(reload({stream:true}));
});


///////////////////////////////////////////
//
//	Task: Browser-Sync
//	
//////////////////////////////////////////
gulp.task( 'browserSync', function() {
	browserSync.init(['./public/css/*.css',  './views/index.ejs'], {
        proxy: "localhost:3300"
  	});	
});



///////////////////////////////////////////
//
//	Task: Watch
//	
//////////////////////////////////////////

gulp.task('watch', function() {
    gulp.watch('./public/sass/**/*.scss', ['sass']);
    gulp.watch('./views/index.ejs', ['html']);
    gulp.watch('./public/css/*.css');
});



//gulp.task('dev', ['watch:server', 'watch', 'browserSync']);
gulp.task('dev', ['watch:server']);
