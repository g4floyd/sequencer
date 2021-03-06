angular.module('app').service('Sequencer', function($location) {
	let AudioContext;
	let webAudioApiContext;
	const location = $location;
	const url = `${location.$$protocol}://${location.$$host}:${location.$$port}`;

	if(window.AudioContext) {
		AudioContext = window.AudioContext;
		webAudioApiContext = 'default';
	} else if (window.webkitAudioContext) {
		AudioContext = window.webkitAudioContext;
		webAudioApiContext = 'webkit';
	}	else {
		alert("Sorry, your browser does not support the Web Audio API. Try Google Chrome.");
	}

	const audioContext = new AudioContext();

	let noteTime, startTime, rhythmIndex, timeoutId, requestId, source;
	let pattern = [[],[],[],[],[],[],[],[],[],[],[],[]];
	let tempo = 120;
	let loopLength = 12;
	const self = this;

	function getAudioBuffer(soundFileUrl) {
		let promise = new Promise(function(resolve, reject) {
			let request = new XMLHttpRequest();
			request.open('get', soundFileUrl, true);
			request.responseType = 'arraybuffer';
			request.onload = function(){
				audioContext.decodeAudioData(request.response, function(buffer){
					resolve(buffer);
				}, function(){reject("Failed to load song");});
			};
			request.send();
		});
		return promise;
	}

	this.getSounds = function() {
		return Promise.all([
			getAudioBuffer(`${url}/kick.mp3`),
			getAudioBuffer(`${url}/snare.mp3`),
			getAudioBuffer(`${url}/hit-hat.mp3`),
			getAudioBuffer(`${url}/crash.mp3`),
			getAudioBuffer(`${url}/rim-shot.mp3`),
			getAudioBuffer(`${url}/clave.mp3`),
			getAudioBuffer(`${url}/maracas.mp3`),
			getAudioBuffer(`${url}/clap.mp3`)
		]);
	};

	this.getTempo = function() {
		return tempo;
	};

	this.getPattern = function() {
		return pattern;
	};

	this.updateBeat = function(sound, beatIndex) {

		let soundsAtBeatIndex = pattern[beatIndex];
		let soundInBeatIndex = soundsAtBeatIndex.find(soundInBeatIndex => soundInBeatIndex === sound);

		if(soundInBeatIndex) {
			pattern[beatIndex] = soundsAtBeatIndex.filter(existingSound => existingSound != sound);
		} else {
			pattern[beatIndex].push(sound);
		}

		return pattern;
	};

	this.updateTempo = function(newTempo) {
		tempo = parseInt(newTempo);
	};

	this.playSound = function(buffer) {
		let source = audioContext.createBufferSource();
		source.buffer = buffer;
		source.connect(audioContext.destination);
		source.start(0);
	};

	this.start = function(){
		noteTime = 0.0;
		startTime = audioContext.currentTime + 0.2;
		rhythmIndex = 0;
		self.rhythmIndex = rhythmIndex;
		schedule();
	};

	this.stop = function() {
		cancelAnimationFrame(requestId);
		angular.element(document.querySelectorAll(".sound")).removeClass('current-beat playing');
	};

	function playSound(sound) {
		source = audioContext.createBufferSource();
		source.buffer = sound.sound;
		source.connect(audioContext.destination);
		source.start(0);
	}

	const highlightCurrentlyPlayingSounds = function(rhythmIndex) {
		let soundsInLastBeat = angular.element(document.querySelectorAll(`[data-beatIndex='${(rhythmIndex + loopLength - 1) % loopLength}']`));
		let soundsInCurrentBeat = angular.element(document.querySelectorAll(`[data-beatIndex='${rhythmIndex}']`));

		soundsInCurrentBeat.addClass('current-beat');
		angular.forEach(soundsInCurrentBeat, function(sound) {
			if(angular.element(sound).hasClass('active')) {
				angular.element(sound).addClass('playing');
			}
		});
		soundsInLastBeat.removeClass('current-beat playing');
	};

	function schedule() {
		let currentTime = audioContext.currentTime;
		if(webAudioApiContext != 'webkit') {
			currentTime -= startTime;
		}
		while (noteTime < currentTime + 0.200) {
			let contextPlayTime = noteTime + startTime;
			let sounds = pattern[rhythmIndex];
			if (sounds.length > 0) {
				for(let sound of sounds) {
					playSound(sound);
				}
			}
			highlightCurrentlyPlayingSounds(rhythmIndex);

			advanceNote();
		}
		requestId = requestAnimationFrame(schedule, 0);
	}

	function advanceNote() {
		let secondsPerBeat = 60.0 / tempo;

		rhythmIndex++;
		self.rhythmIndex = rhythmIndex;
		if (rhythmIndex == loopLength) {
			rhythmIndex = 0;
		}
		noteTime += 0.25 * secondsPerBeat;
	}

});
