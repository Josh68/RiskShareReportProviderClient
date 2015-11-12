// Generated on 2014-11-21 using generator-angular 0.10.0
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Configurable paths for the application
  var appConfig = {
    app: require('./bower.json').appPath || 'app',
    dist: 'main/webapp'
  };

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    yeoman: appConfig,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      bower: {
        files: ['bower.json'],
        tasks: ['wiredep']
      },
      js: {
        files: ['<%= yeoman.app %>/**/*.js'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      html: {
        files: ['<%= yeoman.app %>/**/*.html'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      jsTest: {
        files: ['<%= yeoman.app %>/**/*.spec.js'],
        tasks: ['newer:jshint:test', 'karma']
      },
      compass: {
        files: ['<%= yeoman.app %>/resources/css/**/*.{scss,sass}'],
        tasks: ['compass:server', 'autoprefixer']
      },
      svg: {
        files: ['<%= yeoman.app %>/resources/images/**/*.svg'],
        tasks: ['svg2png']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= yeoman.app %>/**/*.html',
          '.tmp/resources/css/**/*.css',
          '<%= yeoman.app %>/resources/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // The actual grunt server settings
    connect: {
      options: {
        port: 9000,
        // 'localhost'
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: '0.0.0.0',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function(connect, options) { // jshint unused:false
            return [
              function(req, res, next) {
                res.setHeader('WWW-Authenticate', 'xBasic');
                //res.statusCode = 401;
                return next();
              },
              connect.static('.tmp'),
              connect().use(
                '/bower_components',
                connect.static('./bower_components')
              ),
              connect().use(
                '/node_modules',
                connect.static('./node_modules')
              ),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      test: {
        options: {
          port: 9876,
          middleware: function(connect) {
            return [
              function(req, resp, next) {
                resp.setHeader('WWW-Authenticate', 'xBasic');
                next();
              },
              connect.static('.tmp'),
              connect.static('test'),
              connect().use(
                '/bower_components',
                connect.static('./bower_components')
              ),
              connect().use(
                '/node_modules',
                connect.static('./node_modules')
              ),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          base: '<%= yeoman.dist %>'
        }
      }
    },

    svg2png: {
      dist: {
        files: [
          {
            cwd: '<%= yeoman.app %>/resources/images/',
            src: ['{,*/}*.svg'],
            dest: '<%= yeoman.dist %>/resources/images/'
          }
        ]
      },
      server: {
        files: [
          {
            cwd: '<%= yeoman.app %>/resources/images/',
            src: ['{,*/}*.svg'],
            dest: '<%= yeoman.app %>/resources/images/'
          }
        ]
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/**/*.js'
        ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['<%= yeoman.app %>/**/*.spec.js']
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/{,*/}*',
            '!<%= yeoman.dist %>/.git{,*/}*',
            '!<%= yeoman.dist %>/WEB-INF{,*/}*'
          ]
        }]
      },
      server: '.tmp'
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ['last 1 version']
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/resources/css/',
          src: '/resources/css/{,*/}*.css',
          dest: '.tmp/resources/css/'
        }]
      }
    },

    // Automatically inject Bower components into the app
    wiredep: {
      app: {
        src: ['<%= yeoman.app %>/index.html'],
        ignorePath: /\.\.\//
      },
      sass: {
        src: ['<%= yeoman.app %>/resources/css/**/*.{scss,sass}'],
        ignorePath: /(\.\.\/){1,2}bower_components\//
      }
    },

    // Compiles Sass to CSS and generates necessary files if requested
    compass: {
      options: {
        require: ['modular-scale', 'sassy-math', 'rgbapng'], //you will be prompted to install (using gem install) if they're not on your box
        sassDir: '<%= yeoman.app %>/resources/css',
        cssDir: '.tmp/resources/css',
        generatedImagesDir: '.tmp/resources/images/generated',
        imagesDir: '<%= yeoman.app %>/resources/images',
        //javascriptsDir: '<%= yeoman.app %>/scripts', //what to do if these are peppered all over?
        fontsDir: '<%= yeoman.app %>/resources/fonts',
        //importPath: './bower_components',
        httpImagesPath: '/resources/images',
        httpGeneratedImagesPath: '/resources/images/generated',
        httpFontsPath: '/resources/fonts',
        relativeAssets: false,
        assetCacheBuster: false,
        raw: 'Sass::Script::Number.precision = 10\n',
        bundleExec: true, //user bundler to handle SASS/Compass/Ruby dependencies (versioning)
        force: true
      },
      dist: {
        options: {
          generatedImagesDir: '<%= yeoman.dist %>/resources/images/generated',
          httpFontsPath: '../fonts', //in prod, do not use an absolute path, should handle proxy path (like modahealth.com/riskshare/css/fonts/...)
          httpImagesPath: '../images' //in production, images is a dir up from the css
        }
      },
      server: {
        options: {
          debugInfo: true,
          force: true
        }
      }
    },

    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= yeoman.dist %>/**/*.js',
          '!<%= yeoman.app %>/**/*.spec.js',
          '<%= yeoman.dist %>/resources/css/{,*/}*.css',
          '<%= yeoman.dist %>/resources/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= yeoman.dist %>/resources/fonts/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>',
        flow: {
          html: {
            steps: {
              js: ['concat', 'uglifyjs'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },

    // Performs rewrites based on filerev and the useminPrepare configuration
    usemin: {
      html: ['<%= yeoman.dist %>/**/*.html'],
      css: ['<%= yeoman.dist %>/resources/css/{,*/}*.css'],
      options: {
        assetsDirs: ['<%= yeoman.dist %>', '<%= yeoman.dist %>/resources/images']
      }
    },

    // The following *-min tasks will produce minified files in the dist folder
    // By default, your `index.html`'s <!-- Usemin block --> will take care of
    // minification. These next options are pre-configured if you do not wish
    // to use the Usemin blocks.
    // cssmin: {
    //   dist: {
    //     files: {
    //       '<%= yeoman.dist %>/resources/css/main.css': [
    //         '.tmp/resources/css/{,*/}*.css'
    //       ]
    //     }
    //   }
    // },
    // uglify: {
    //   dist: {
    //     files: {
    //       '<%= yeoman.dist %>/scripts/scripts.js': [
    //         '<%= yeoman.dist %>/scripts/scripts.js'
    //       ]
    //     }
    //   }
    // },
    // concat: {
    //   dist: {}
    // },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/resources/images',
          src: '{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= yeoman.dist %>/resources/images'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/resources/images',
          src: '{,*/}*.svg',
          dest: '<%= yeoman.dist %>/resources/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true,
          removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          //src: ['*.html', '{,*/}*.html', 'views/{,*/}*.html', 'layout/{,*/}*.html'], //could this be handled (more slowly) with '**/*.html'
          src: ['**/*.html'],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },

    // ng-annotate tries to make the code safe for minification automatically
    // by using the Angular long form for dependency injection.
    ngAnnotate: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/scripts',
          src: ['*.js', '!oldieshim.js'],
          dest: '.tmp/concat/scripts'
        }]
      }
    },

    // Replace Google CDN references
    cdnify: {
      dist: {
        html: ['<%= yeoman.dist %>/*.html']
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '**/*.html', //restructuring app has more paths for html - this is still reasonably fast and I think correct for copying
            //'*.html',
            //'{,*/}*.html',
            //'views/{,*/}*.html',
            //'layout/{,*/}*.html',
            'resources/images/{,*/}*.{webp}',
            'resources/fonts/{,*/}*.*'
          ]
        }, {
          expand: true,
          cwd: '.tmp/resources/images',
          dest: '<%= yeoman.dist %>/resources/images',
          src: ['generated/*']
        }]
      },
      styles: {
        expand: true,
        cwd: '<%= yeoman.app %>/resources/css',
        dest: '.tmp/resources/css',
        src: '{,*/}*.css'
      }
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: [
        'compass:server'
        
      ],
      test: [
        'compass'
      ],
      dist: [
        'compass:dist',
        'imagemin',
        'svgmin'
        
      ]
    },

    // Test settings
    karma: {
      unit: {
        configFile: 'test/karma.conf.js'
          // singleRun boolean
          // , singleRun: false
          // web server port
          // , port: 9876
      }
    },

    //task to include static ngincludes (header, menu, footer)
    nginclude: {
      options: {
        assetsDirs: ['<%= yeoman.app %>']
      },
      dist: {
        files: [{
          src: '<%= yeoman.app %>/index.html',
          dest: '<%= yeoman.dist %>/index.html'
        }]
      }
    }
  });


  //GRUNT register tasks
  grunt.registerTask('serve', 'Compile then start a connect web server', function(target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'wiredep',
      'svg2png:server',
      'concurrent:server',
      'autoprefixer',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function(target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve:' + target]);
  });

  grunt.registerTask('test', [
    'clean:server',
    'concurrent:test',
    'autoprefixer',
    'connect:test',
    'karma'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'wiredep',
    'useminPrepare',
    'svg2png:dist',
    'concurrent:dist',
    'autoprefixer',
    'concat',
    'ngAnnotate',
    'copy:dist',
    //'nginclude:dist',
    'cdnify',
    'cssmin',
    'uglify',
    'filerev',
    'usemin',
    'htmlmin'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'build'
  ]);
};
