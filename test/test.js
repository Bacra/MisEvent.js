function createAndInitClass(runCall){
	var TestClass = function(){
		this.runTimes = 0;
	};
	TestClass.prototype.run = function(){
		this.runTimes++;
		if (runCall) return runCall.apply(this, arguments);
	};
	MisEvent(TestClass);
	return new TestClass();
}





////////////////////////
module('only init class');
test('init class', 2, function(){
	var obj = createAndInitClass();
	ok(obj && obj.run, 'init and get object');
	obj.run();
	ok(obj.runTimes, 'run method');
});



////////////////////////
module('bind method');
test('bind method and run times', 3, function(){
	var obj = createAndInitClass(),
		runTimes = 0;
	obj.on('run', function(){
		runTimes++;
	});

	equal(runTimes, 0, 'run bind before');
	obj.run();
	equal(runTimes, 1, 'run bind after');
	obj.run();
	obj.run();
	obj.run();
	equal(runTimes, 4, 'run '+runTimes+'/4 times');
});

test('bind more func once', 1, function(){
	var obj = createAndInitClass(),
		runTimes = 0;

	obj.on('run run.after run.before run.final run.unname', function(){
		runTimes++;
	});
	obj.run();
	equal(runTimes, 5, 'bind more func once');
});

test('bind more Event and run in order', 6*3, function(){
	var obj = createAndInitClass(),
		index = 0;
	
	obj.on('run.before', function(){
		equal(index++%6, 0, 'before run 1st');
	});
	obj.on('run.after', function(){
		equal(index++%6, 2, 'after run 3rd');
	});
	obj.on('run.final', function(){
		equal(index++%6, 4, 'final run 5th');
	});
	obj.on('run.after', function(){
		equal(index++%6, 3, 'after run 4th');
	});
	obj.on('run.final', function(){
		equal(index++%6, 5, 'final run 6th');
	});
	obj.on('run', function(){
		equal(index++%6, 1, 'blank(before) run 2nd');
	});

	obj.run();
	obj.run();
	obj.run();
});


test('bind when method has runned', 2, function(){
	var obj = createAndInitClass(),
		runTimes = 0;
	obj.on('run', function(){
		runTimes++;
	});
	obj.run();
	obj.on('run', function(){
		runTimes++;
	});
	obj.run();
	equal(runTimes, 1+2*1, 'the 2nd bind method runed');
	obj.run();
	obj.run();
	equal(runTimes, 1+2*3, 'the 2nd bind method runed again');
});




////////////////////////
module('off Method');
test('off method', 3, function(){
	var obj = createAndInitClass(),
		func = function(){
			hasRuned = true;
		},
		runTimes = 0,
		hasRuned = false;

	obj.on('run', function(){
		runTimes++;
	});
	obj.on('run', func);
	obj.on('run', function(){
		runTimes++;
	});

	obj.off(func);

	obj.run();
	obj.run();
	obj.run();
	ok(!hasRuned, 'off the method which bind justnow');
	equal(runTimes, 2*3, 'no off method run times:'+runTimes+'/2');

	obj.off();
	obj.run();
	obj.run();

	equal(runTimes, 2*3, 'off all method');
});

test('off method width Event object', 2, function(){
	var obj = createAndInitClass(),
		runTimes = 0;
	obj.on('run', function(e){
		runTimes++;
		e.offSelf();
	});

	obj.run();
	equal(runTimes, 1, 'method has runned');
	obj.run();
	obj.run();
	obj.run();
	equal(runTimes, 1, 'method has off');
});




///////////////////////
module('bind once');
test('once method', 2, function(){
	var obj = createAndInitClass(),
		runTimes = 0;
	obj.once('run', function(){
		runTimes++;
	});
	obj.run();
	equal(runTimes, 1, 'method has runned');

	obj.run();
	obj.run();
	obj.run();
	equal(runTimes, 1, 'method has off');
});




///////////////////////
module('dynamically add methods');
test('on init method', 1, function(){
	var obj = createAndInitClass(),
		hasRuned = false;
	obj.on('run2', function(){
		hasRuned = true;
	});
	obj.run2();
	
	ok(hasRuned, 'the method which dynamically add has runned');
});





////////////////////////
module('bind method width Event');
test('Check param of the Event', 12, function(){
	var obj = createAndInitClass();
	obj.on('run', function(e){
		ok(e, 'width Event param');
		ok(e && e.data, 'Event param has `data`');
		ok(e && e.on, 'Event param has `on` method');
		ok(e && e.off, 'Event param has `off` method');
		ok(e && e.once, 'Event param has `data` method');
		ok(e && e.param, 'Event param has `param`');
		ok(e && e.removeParam, 'Event param has `removeParam`');
		ok(e && e.offSelf, 'Event param has `offSelf` method');
		ok(e && e.preventDefault, 'Event param has `preventDefault` method');
		ok(e && e.overrideDefault, 'Event param has `overrideDefault` method');
		ok(e && e.setDefReturn, 'Event param has `setDefReturn` method');
		ok(e && e.async, 'Event param has `async` method');
	});
	obj.run();
});


test('exta data', 3, function(){
	var obj = createAndInitClass(),
		data = {'index': 1},
		index = 0;
	obj.on('run', data, function(e){
		if (index++ === 0) {
			equal(e.data.index++, 1, 'read data param');
		} else {
			equal(e.data.index, 2, 'data change');
		}
	});

	obj.run();
	obj.on('run', data, function(){
		equal(data.index, 2, 'data do not extend storage');
	});
	obj.run();
});


test('preventDefault', 4, function(){
	var obj = createAndInitClass(),
		runTimes = 0;

	obj.on('run', function(){});
	obj.run();

	equal(obj.runTimes, 1, 'default method run');

	obj.on('run', function(e){
		e.preventDefault();
		runTimes++;
	});

	obj.run();
	obj.run();
	equal(runTimes, 2, 'bind method runned');
	equal(obj.runTimes, 1, 'default method is prevented');

	obj.on('run', function(e){
		e.preventDefault('setDefReturn');
		equal(e.defReturn, 'setDefReturn', 'setDefReturn by preventDefault method');
	});

	obj.run();

});


test('next', 5, function(){
	var obj = createAndInitClass(),
		index = 0;
	obj.on('run', function(e){
		equal(index++, 0, 'run 1st');
		e.next();
		equal(index, 3, 'run all query');
		e.next();
		e.next();
		equal(index, 3, 'run no query');
	});

	obj.on('run', function(){
		equal(index++, 1, 'run 2nd');
	});

	obj.on('run', function(e){
		equal(index++, 2, 'run 3rd');
		e.next();
	});

	obj.run();
});


test('overrideDefault', 4, function(){
	var obj = createAndInitClass();
	obj.once('run', function(e){
		e.overrideDefault(function(){
			return 5;
		});
	});
	obj.once('run', function(e){
		ok(!e.defReturn, 'do not has defReturn in before query');
	});
	obj.once('run.after', function(e){
		equal(e.defReturn, 5, 'defReturn is 5');
	});

	obj.run();
	equal(obj.runTimes, 0, 'defaultFunc is prevented');

	obj.once('run.after', function(e){
		ok(!e.defReturn, 'defaultFuc reset');
	});

	obj.run();
});

test('defReturn and setDefReturn', 7, function(){
	var obj = createAndInitClass();

	// setDef normal
	obj.once('run.after', function(e){
		e.setDefReturn(4);
		equal(e.defReturn, 4, 'setDefReturn in after query');
	});
	obj.run();

	// setDef in before query
	obj.once('run', function(e){
		var rs = e.setDefReturn(1);
		ok(!rs, 'can not set defReturn');
		ok(!e.defReturn, 'do not setDefReturn');

		e.overrideDefault();
		rs = e.setDefReturn(2);
		ok(rs, 'now can set defReturn');
		equal(e.defReturn, 2, 'set defReturn success');
	});

	// run defCall defReturn is reseted
	obj.once('run.after', function(e){
		ok(!e.defReturn, 'defReturn reset to `undefined`');
	});

	obj.run();

	// defReturn param can not modify directly
	obj.on('run.after', function(e){
		e.defReturn = 8;
	});
	obj.on('run.after', function(e){
		ok(!e.defReturn, 'defReturn param can not modify directly');
	});
	obj.run();
});


asyncTest('async', 3, function(){
	var obj = createAndInitClass(),
		func = function(){
			runTimes++;
		},
		runTimes = 0;
	obj.on('run', func);
	obj.on('run', function(e){
		var done = e.async();
		setTimeout(function(){
			done();
			equal(runTimes, 4, 'after async');
			done();
			equal(runTimes, 4, 'run async done method again');
			start();
		}, 100);
	});
	obj.on('run.after run run.final', func);

	obj.run();
	equal(runTimes, 1, 'before async');
});





///////////////////////
module('deal param');
test('base param', 1+6+ 4*3, function(){
	var obj = createAndInitClass();
	obj.param('run', {'base1': true, 'base2': true, 'base3': true}, true);
	obj.once('run', function(e){
		ok(e.param.base1, 'base1 has init');
		e.param.base1 = false;
		e.param({'base2': false, 'base4': true}, true);
	});

	obj.once('run', function(e){
		ok(e.param.base3, 'base3 is extsis in 2nd method');
		ok(!e.param.base1, 'base1 switch to false');

		// mark edit
		ok(e.param.base2, 'base2 no change value in RE');
		ok(!e.param('base2', true), 'global base2 switch to false in global');

		// mark add
		ok(!e.param.base4, 'base4 is not inited in RE');
		ok(e.param('base4', true), 'base4 is inited in global');
	});

	obj.run();

	obj.on('run', function(e){
		ok(e.param.base1, '#2 base1 no change value');
		ok(!e.param.base2, '#2 base2 switch to false');
		ok(e.param.base3, '#2 base3 no change value');
		ok(e.param.base4, '#2 base4 has inited');
	});

	obj.run();
	obj.run();
	obj.run();
});

test('temp param', 1+6+4+2*3, function(){
	var obj = createAndInitClass();
	obj.param('run', {'temp1': true, 'temp2': true, 'temp3': true});
	obj.once('run', function(e){
		ok(e.param.temp1, 'temp1 has init');
		e.param.temp1 = false;
		e.param({'temp2': false, 'temp4': true});
	});
	obj.once('run', function(e){
		ok(e.param.temp3, true, 'temp3 is extsis in 2nd method');
		ok(!e.param.temp1, 'temp1 switch to false');

		// mark edit
		ok(e.param.temp2, 'temp2 no change value in RE');
		ok(!e.param('temp2'), 'global temp2 switch to false in global');

		// mark add
		ok(!e.param.temp4, 'temp4 is not inited in RE');
		ok(e.param('temp4'), 'temp4 is inited in global');
	});

	obj.run();

	obj.once('run', function(e){
		ok(!e.param.temp1, '#2 temp1 is cleared');
		ok(!e.param.temp3, '#2 temp3 is cleared');
		deepEqual(e.param.temp2, false, '#2 temp2 switch to false');
		ok(e.param.temp4, '#2 temp4 has inited');
	});

	obj.run();

	obj.on('run', function(e){
		ok(!e.param.temp2, '#3 temp2 is cleared');
		ok(!e.param.temp4, '#3 temp4 is cleared');
	});

	obj.run();
	obj.run();
	obj.run();
});


test('base and temp param', 1, function(){
	var obj = createAndInitClass();
	obj.param('run', {'p': 2}, true);
	obj.param('run', {'p': 1});

	obj.on('run', function(e){
		equal(e.param.p, 1, 'p value is equal temp param');
	});

	obj.run();
});


test('param in query', 2*6, function(){
	var obj = createAndInitClass();
	obj.param('run', {'temp': 1, 'base': 1});

	obj.on('run', function(e){
		equal(e.param.temp++, 1, 'temp has inited');
		equal(e.param.base++, 1, 'base has inited');
	});

	obj.on('run.after', function(e){
		equal(e.param.temp++, 3, 'temp has inited');
		equal(e.param.base++, 3, 'base has inited');
	});

	obj.on('run.before', function(e){
		equal(e.param.temp++, 2, 'temp has inited');
		equal(e.param.base++, 2, 'base has inited');
	});

	obj.on('run.final', function(e){
		equal(e.param.temp++, 5, 'temp has inited');
		equal(e.param.base++, 5, 'base has inited');
	});

	obj.on('run.final', function(e){
		equal(e.param.temp++, 6, 'temp has inited');
		equal(e.param.base++, 6, 'base has inited');
	});

	obj.on('run.after', function(e){
		equal(e.param.temp++, 4, 'temp has inited');
		equal(e.param.base++, 4, 'base has inited');
	});

	obj.run();
});



///////////////////////
module('do in default');
test('on in default', 1, function(){
	var obj = createAndInitClass(function(){
			this.on('run.after', function(){
				hasRuned = true;
			});
		}),
		hasRuned = false;

	// init method
	obj.param('run', {});

	obj.run();
	ok(hasRuned, 'the method which bind in default method has runned');
});





//////////////////////
module('bind from json');
test('bind', 1, function(){
	var myClass = function(){},
		bind = MisEvent(myClass),
		obj = new myClass(),
		hasRuned = false;
	
	bind(obj, {
		'onRun.after': function(){
			hasRuned = true;
		}
	});
	obj.run();

	ok(hasRuned, 'bind after method');
});
