const Benchmark = require('benchmark');
const substrings = require('../lib/commonSubstrings');

const suite = new Benchmark.Suite;

const input = [
	"java",
	"offe",
	"coffescript",
	"typescript",
	"typed",
	"javacoffie",
	"fessss",
	"fe"
];

suite.add('getSubstrings benchmarking', function() {
		substrings(input, {
			minOccurrence: 2,
			minLength: 2,
		});
	})
	.on('cycle', function(event) {
		console.log(String(event.target));
	})
	.on('complete', function() {
		console.log('Fastest is ' , this[0].times.period);
	})
	// run async
	.run({ 'async': true });
