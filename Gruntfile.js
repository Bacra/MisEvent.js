module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				banner: '/** MisEvent v<%= pkg.version %> */<%= grunt.util.linefeed %>'
			},
			node: {
				src: [
					'src/intro-node.js',
					'src/MisEvent.js',
					'src/outro.js'
				],
				dest: 'lib/MisEvent.js'
			},
			js: {
				src: [
					'src/intro-js.js',
					'src/MisEvent.js',
					'src/outro.js'
				],
				dest: 'dist/MisEvent.js'
			}
		},
		gcc: {
			js: {
				src: 'dist/MisEvent.js',
				dest: 'dist/MisEvent.min.js',
				options: {
					source_map_format: 'V3',
					create_source_map: 'dist/MisEvent.js.map'
				}
			}
		},

		qunit: {
			qunit: [
				"test/test.html"
			]
		}
	});


	grunt.registerTask('fix', 'fix source map prototype.', function(){
		var mapfile = "dist/MisEvent.js.map";

		var code = grunt.file.read(mapfile);
		code = code.replace(/^"sources":\[[^\]]*?\],$/m, '"sources":["MisEvent.js"],');
		grunt.file.write(mapfile, code);

		var minfile = "dist/MisEvent.min.js",
			version = grunt.config('pkg.version');

		code = grunt.file.read(minfile);
		code = '/*! MisEvent '+version+' | MIT*/'+code +grunt.util.linefeed+'//@ sourceMappingURL=MisEvent.js.map';

		grunt.file.write(minfile, code);

	});



	grunt.registerTask('backup', 'copy backup.', function() {
		var version = grunt.config('pkg.version');
		grunt.file.copy('lib/MisEvent.js', 'lib/MisEvent-'+version+'.js');
		grunt.file.copy('dist/MisEvent.js', 'dist/'+version+'/MisEvent.js');
		grunt.file.copy('dist/MisEvent.min.js', 'dist/'+version+'/MisEvent.min.js');
		grunt.file.copy('dist/MisEvent.js.map', 'dist/'+version+'/MisEvent.js.map');
	});


	grunt.loadNpmTasks('grunt-gcc');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-qunit');

	grunt.registerTask('default', ['concat', 'qunit']);
	grunt.registerTask('exports', ['concat', 'qunit', 'gcc', 'fix', 'backup']);
};