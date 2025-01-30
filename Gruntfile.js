const dartSass = require('sass')

module.exports = function (grunt) {
  grunt.initConfig({
    // Clean
    clean: ['public'],

    // Builds Sass
    sass: {
      dev: {
        options: {
          implementation: dartSass,
          style: 'expanded',
          sourcemap: true,
          quietDeps: true,
          includePaths: [
            'node_modules',
            'app/assets/sass'
          ],
          outputStyle: 'compressed'
        },
        files: [
          {
            expand: true,
            cwd: 'app/assets/sass',
            src: ['*.scss'],
            dest: 'public/stylesheets/',
            ext: '.min.css'
          },
          // This builds custom branding css
          {
            expand: true,
            cwd: 'node_modules/@govuk-pay/pay-js-commons/sass/',
            src: ['**/*.scss'],
            dest: 'public/stylesheets/',
            ext: '.min.css'
          }
        ]
      }
    },

    // Copies templates and assets from external modules and dirs
    copy: {
      html5shiv: {
        files: [
          {
            expand: true,
            cwd: 'node_modules/html5shiv/dist',
            src: 'html5shiv.min.js',
            dest: 'public/vendor/'
          }
        ]
      },
      assets: {
        files: [
          {
            expand: true,
            cwd: 'app/assets/',
            src: ['**/*', '!sass/**'],
            dest: 'public/'
          }
        ]
      }
    },

    // Watches assets and sass for changes
    watch: {
      css: {
        files: ['app/assets/sass/**/*.scss'],
        tasks: ['sass'],
        options: {
          spawn: false,
          livereload: true
        }
      },
      js: {
        files: ['app/browsered.js', 'app/browsered/*.js'],
        tasks: ['browserify', 'babel'],
        options: {
          spawn: false,
          livereload: true
        }
      },
      assets: {
        files: ['app/assets/**/*', '!app/assets/sass/**'],
        tasks: ['copy:assets'],
        options: {
          spawn: false
        }
      }
    },

    browserify: {
      'public/js/application.js': ['app/browsered.js'],
      options: {
        browserifyOptions: {
          standalone: 'module'
        }
      }
    },

    babel: {
      options: {
        presets: ['@babel/preset-env'],
        compact: false
      },
      dist: {
        files: {
          'public/js/application.js': 'public/js/application.js'
        }
      }
    },

    uglify: {
      my_target: {
        files: {
          'public/js/application.min.js': ['public/js/application.js']
        }
      }
    }
  });

  [
    'grunt-babel',
    'grunt-browserify',
    'grunt-contrib-copy',
    'grunt-contrib-clean',
    'grunt-contrib-watch',
    'grunt-contrib-uglify',
    'grunt-sass'
  ].forEach(function (task) {
    grunt.loadNpmTasks(task)
  })

  grunt.registerTask('generate-assets', [
    'clean',
    'copy',
    'sass',
    'browserify',
    'babel',
    'uglify'
  ])

  const defaultTasks = ['generate-assets', 'concurrent:target']

  if (process.env.LOCAL_ENV) {
    defaultTasks.unshift('env:dev')
  }

  grunt.registerTask('default', defaultTasks)

  grunt.event.on('watch', function (action, filepath, target) {
    // just copy the asset that was changed, not all of them

    if (target === 'assets') {
      grunt.config(
        'copy.assets.files.0.src',
        filepath.replace('app/assets/', '')
      )
    }
  })
}
